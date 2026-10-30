import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Finish, Network, NetworkNode, Skin } from '$lib/types';

// La piscine vide, le coeur et le réseau. Une seule instance vit dans le layout et survit aux navigations.

const RW = 30, RL = 42, RH = 9, PW = 12, PL = 25, PD = 2.1, WATER = -0.18, HEART_Y = 1.9, TILE_M = 2;
const FOG = 0xd9d9d4;
const PI = Math.PI;

export type PoolOptions = {
	onSelect: (node: NetworkNode | null) => void;
	/** Premier rendu complet (salle + réseau) : le canvas peut apparaître. */
	onReady: () => void;
	reducedMotion: boolean;
};

// PRNG déterministe : une même personne garde la même place dans le bassin
function prng(seed: number) {
	let s = (seed * 2654435761) % 2147483647 || 1;
	return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function tileTexture(base: [number, number, number], grout: string, variation: number, dirt: number) {
	const c = document.createElement('canvas');
	c.width = c.height = 512;
	const g = c.getContext('2d')!;
	g.fillStyle = grout;
	g.fillRect(0, 0, 512, 512);
	const r = prng(3);
	for (let y = 0; y < 8; y++)
		for (let x = 0; x < 8; x++) {
			const v = Math.round((r() - 0.5) * variation);
			const [R, G, B] = base.map((k) => Math.max(0, Math.min(255, k + v)));
			g.fillStyle = `rgb(${R},${G},${B})`;
			g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
			if (r() < dirt) {
				g.fillStyle = 'rgba(80,78,70,.12)';
				g.fillRect(x * 64 + 2, y * 64 + 2 + r() * 30, 60, 30);
			}
			g.fillStyle = 'rgba(255,255,255,.35)';
			g.fillRect(x * 64 + 4, y * 64 + 4, 56, 3);
		}
	const t = new THREE.CanvasTexture(c);
	t.wrapS = t.wrapT = THREE.RepeatWrapping;
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

function scaleUV(geo: THREE.BufferGeometry, sx: number, sy: number) {
	const uv = geo.attributes.uv;
	for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
	return geo;
}

// Coeur bombé et symétrique : distance à une sphère déformée (unités ~15)
function heartField(X: number, Y: number, Z: number) {
	const x = Math.abs(X);
	const y = 4 + Y * 1.2 - x * Math.sqrt(Math.max((20 - x) / 15, 0));
	const z = Z * (2 - y / 15);
	return Math.sqrt(x * x + y * y + z * z) - 10;
}

function unitSphere(detail: number) {
	const g = new THREE.IcosahedronGeometry(1, detail);
	g.deleteAttribute('uv');
	g.deleteAttribute('normal');
	return mergeVertices(g, 1e-5);
}

function heartGeometry(detail: number) {
	const g = unitSphere(detail);
	const p = g.attributes.position;
	const d = new THREE.Vector3();
	const cy = -2;
	for (let i = 0; i < p.count; i++) {
		d.fromBufferAttribute(p, i).normalize();
		const f = (r: number) => heartField(d.x * r, cy + d.y * r, d.z * r);
		let r = 30;
		while (r > 0.1 && f(r) > 0) r -= 0.25;
		let lo = r, hi = r + 0.25;
		for (let k = 0; k < 16; k++) {
			const m = (lo + hi) / 2;
			if (f(m) > 0) hi = m;
			else lo = m;
		}
		p.setXYZ(i, d.x * lo, cy + d.y * lo, d.z * lo);
	}
	g.center();
	g.computeBoundingBox();
	// pointe arrondie : sous y0, la hauteur sature doucement au lieu de filer en pointe
	const b = g.boundingBox!, H = b.max.y - b.min.y, y0 = b.min.y + 0.13 * H, c = 0.085 * H;
	for (let i = 0; i < p.count; i++) {
		const y = p.getY(i);
		if (y < y0) p.setY(i, y0 - c * (1 - Math.exp(-(y0 - y) / c)));
	}
	g.center();
	g.computeBoundingBox();
	const w = g.boundingBox!.max.x - g.boundingBox!.min.x;
	g.scale(2.2 / w, 2.2 / w, 2.2 / w);
	g.computeVertexNormals();
	return g;
}

function signTexture(lines: { t: string; f: string; x: number; y: number; c?: string; a?: CanvasTextAlign }[], w: number, h: number, bg = '#f4f4f0', border = false) {
	const c = document.createElement('canvas');
	c.width = w;
	c.height = h;
	const g = c.getContext('2d')!;
	g.fillStyle = bg;
	g.fillRect(0, 0, w, h);
	if (border) {
		g.strokeStyle = '#111';
		g.lineWidth = 10;
		g.strokeRect(5, 5, w - 10, h - 10);
	}
	for (const l of lines) {
		g.fillStyle = l.c ?? '#111';
		g.font = l.f;
		g.textAlign = l.a ?? 'left';
		g.fillText(l.t, l.x, l.y);
	}
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	t.anisotropy = 8;
	return t;
}

export class PoolScene {
	private renderer: THREE.WebGLRenderer;
	private scene = new THREE.Scene();
	private camera = new THREE.PerspectiveCamera(48, 1, 0.05, 120);
	private controls: OrbitControls;
	private timer = new THREE.Timer();
	private readyAt = -1;
	private raf = 0;
	private uTime = { value: 0 };
	private disposables: { dispose(): void }[] = [];

	private heartRoot = new THREE.Group();
	private beatGroup = new THREE.Group();
	private heartMesh!: THREE.Mesh;
	private skins: Partial<Record<Skin, THREE.Group>> = {};
	private skin: Skin = 'none';
	private skinMat!: THREE.MeshStandardMaterial;
	private haloMat!: THREE.MeshStandardMaterial;
	private skinUpdates: Partial<Record<Skin, (t: number) => void>> = {};
	private flick!: THREE.MeshBasicMaterial;
	private rulesMat!: THREE.MeshStandardMaterial;

	private nodes: THREE.InstancedMesh | null = null;
	private nodeEdges: THREE.InstancedMesh | null = null;
	private links: THREE.LineSegments | null = null;
	private hiLinks: THREE.LineSegments;
	private net: Network = { nodes: [], links: [], total: 0 };
	private positions: THREE.Vector3[] = [];
	private selected = -1;

	private ray = new THREE.Raycaster();
	private mouse = new THREE.Vector2();
	private down: [number, number] | null = null;
	private hover = false;
	private hoverK = 0;
	private beatPh = 0;
	private lastT = 0;
	private introDone: boolean;
	private panel = false;
	private panelK = 0; // 0 = coeur centré, 1 = décalé pour laisser la place au panneau
	private animT = 0; // temps d'animation : avance de dt borné, sans à-coup après un gel
	private netKey = '';

	constructor(
		private canvas: HTMLCanvasElement,
		private opts: PoolOptions
	) {
		this.introDone = opts.reducedMotion;
		const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true }));
		r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
		r.toneMapping = THREE.NoToneMapping;

		this.scene.background = new THREE.Color(FOG);
		this.scene.fog = new THREE.Fog(FOG, 14, 46);
		this.camera.position.set(0, 2.8, 17);

		const c = (this.controls = new OrbitControls(this.camera, canvas));
		c.target.set(0, HEART_Y, 0);
		c.enableDamping = true;
		c.dampingFactor = 0.07;
		c.enablePan = false;
		c.minDistance = 3.6;
		c.maxDistance = 13;
		c.minPolarAngle = 0.35;
		c.maxPolarAngle = 1.62;
		c.autoRotate = !opts.reducedMotion;
		c.autoRotateSpeed = 0.35;

		this.buildRoom();
		this.buildHeart();
		this.buildSkins();
		const hiGeo = new THREE.BufferGeometry();
		this.hiLinks = new THREE.LineSegments(hiGeo, new THREE.LineBasicMaterial({ color: 0xb8000f }));
		this.scene.add(this.hiLinks);

		canvas.addEventListener('pointerdown', this.onDown);
		canvas.addEventListener('pointerup', this.onUp);
		canvas.addEventListener('pointermove', this.onMove);
		canvas.addEventListener('pointerleave', this.onLeave);
		addEventListener('resize', this.resize);
		this.resize();
		this.loop();
	}

	private track<T extends { dispose(): void }>(x: T) {
		this.disposables.push(x);
		return x;
	}

	private buildRoom() {
		const s = this.scene, room = new THREE.Group();
		s.add(room);
		const texWall = this.track(tileTexture([236, 236, 231], '#9a9a95', 10, 0.06));
		const texDeck = this.track(tileTexture([214, 214, 208], '#88887f', 14, 0.12));
		const texPool = this.track(tileTexture([208, 214, 214], '#8d9595', 8, 0.04));
		const matWall = this.track(new THREE.MeshStandardMaterial({ map: texWall, roughness: 0.32 }));
		const matDeck = this.track(new THREE.MeshStandardMaterial({ map: texDeck, roughness: 0.5 }));
		const matPoolWall = this.track(new THREE.MeshStandardMaterial({ map: texPool, roughness: 0.4 }));

		const plane = (w: number, h: number, mat: THREE.Material, pos: [number, number, number], rot: [number, number, number]) => {
			const m = new THREE.Mesh(this.track(scaleUV(new THREE.PlaneGeometry(w, h), w / TILE_M, h / TILE_M)), mat);
			m.position.set(...pos);
			m.rotation.set(...rot);
			room.add(m);
			return m;
		};
		plane(RW, RH, matWall, [0, RH / 2, -RL / 2], [0, 0, 0]);
		plane(RW, RH, matWall, [0, RH / 2, RL / 2], [0, PI, 0]);
		plane(RL, RH, matWall, [-RW / 2, RH / 2, 0], [0, PI / 2, 0]);
		plane(RL, RH, matWall, [RW / 2, RH / 2, 0], [0, -PI / 2, 0]);
		const ceil = new THREE.Mesh(this.track(new THREE.PlaneGeometry(RW, RL)), this.track(new THREE.MeshStandardMaterial({ color: 0xc7c7c2, roughness: 0.9 })));
		ceil.position.y = RH;
		ceil.rotation.x = PI / 2;
		room.add(ceil);

		// plage percée du bassin
		const deckShape = new THREE.Shape();
		deckShape.moveTo(-RW / 2, -RL / 2);
		deckShape.lineTo(RW / 2, -RL / 2);
		deckShape.lineTo(RW / 2, RL / 2);
		deckShape.lineTo(-RW / 2, RL / 2);
		deckShape.lineTo(-RW / 2, -RL / 2);
		const hole = new THREE.Path();
		hole.moveTo(-PW / 2, -PL / 2);
		hole.lineTo(-PW / 2, PL / 2);
		hole.lineTo(PW / 2, PL / 2);
		hole.lineTo(PW / 2, -PL / 2);
		hole.lineTo(-PW / 2, -PL / 2);
		deckShape.holes.push(hole);
		const deck = new THREE.Mesh(this.track(scaleUV(new THREE.ShapeGeometry(deckShape), 1 / TILE_M, 1 / TILE_M)), matDeck);
		deck.rotation.x = -PI / 2;
		room.add(deck);

		const edgeMat = this.track(new THREE.MeshStandardMaterial({ color: 0xf1f1ed, roughness: 0.45 }));
		for (const [x, z, w, l] of [
			[0, PL / 2 + 0.2, PW + 0.8, 0.4],
			[0, -PL / 2 - 0.2, PW + 0.8, 0.4],
			[PW / 2 + 0.2, 0, 0.4, PL],
			[-PW / 2 - 0.2, 0, 0.4, PL]
		]) {
			const b = new THREE.Mesh(this.track(new THREE.BoxGeometry(w, 0.08, l)), edgeMat);
			b.position.set(x, 0.04, z);
			room.add(b);
		}
		plane(PL, PD, matPoolWall, [-PW / 2, -PD / 2, 0], [0, PI / 2, 0]);
		plane(PL, PD, matPoolWall, [PW / 2, -PD / 2, 0], [0, -PI / 2, 0]);
		plane(PW, PD, matPoolWall, [0, -PD / 2, -PL / 2], [0, 0, 0]);
		plane(PW, PD, matPoolWall, [0, -PD / 2, PL / 2], [0, PI, 0]);

		// Les shaders maison travaillent en sRGB brut (pas de conversion de couleur).
		const fogRaw = new THREE.Vector3(0xd9 / 255, 0xd9 / 255, 0xd4 / 255);
		const fogU = { uFog: { value: fogRaw }, uFogR: { value: new THREE.Vector2(14, 46) } };
		const texPoolRaw = texPool.clone();
		texPoolRaw.colorSpace = THREE.NoColorSpace;
		this.track(texPoolRaw);
		const poolFloorMat = this.track(
			new THREE.ShaderMaterial({
				uniforms: { uTex: { value: texPoolRaw }, uTime: this.uTime, ...fogU },
				vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
				fragmentShader: `uniform sampler2D uTex; uniform float uTime; uniform vec3 uFog; uniform vec2 uFogR; varying vec3 vW;
					float caus(vec2 p, float t){ float c=0.; for(int i=0;i<3;i++){ p += vec2(sin(p.y*1.3+t*.7), cos(p.x*1.1-t*.6)); c += .5/(.45+abs(sin(p.x*1.7)+sin(p.y*1.9))); } return c/3.; }
					void main(){ vec3 col = texture2D(uTex, vW.xz/2.).rgb * vec3(.8,.84,.85);
						float lx = abs(mod(vW.x+1.2, 2.4)-1.2);
						if (lx < .13 && abs(vW.z) < 11.2) col *= .12;
						if (abs(abs(vW.z)-11.2) < .13 && lx < .55) col *= .12;
						col += pow(caus(vW.xz*.8, uTime), 2.2) * .22;
						float f = smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW));
						gl_FragColor = vec4(mix(col, uFog, f), 1.); }`
			})
		);
		const poolFloor = new THREE.Mesh(this.track(new THREE.PlaneGeometry(PW, PL)), poolFloorMat);
		poolFloor.rotation.x = -PI / 2;
		poolFloor.position.y = -PD;
		room.add(poolFloor);

		const waterMat = this.track(
			new THREE.ShaderMaterial({
				transparent: true,
				depthWrite: false,
				uniforms: { uTime: this.uTime, ...fogU },
				vertexShader: `uniform float uTime; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); w.y += .018*sin(w.x*1.7+uTime*1.3) + .018*sin(w.z*1.3-uTime*1.1); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
				fragmentShader: `uniform float uTime; uniform vec3 uFog; uniform vec2 uFogR; varying vec3 vW;
					void main(){ vec3 V = normalize(cameraPosition - vW); float fr = pow(1.-max(V.y,0.), 4.);
						float rip = sin(vW.x*3.1+uTime*1.6)*sin(vW.z*2.7-uTime*1.2)*.5+.5;
						vec3 col = mix(vec3(.16,.19,.2), vec3(.72,.72,.69), .08 + .82*fr) + rip*.03;
						float a = mix(.42, .95, fr);
						float f = smoothstep(uFogR.x, uFogR.y, length(cameraPosition - vW));
						gl_FragColor = vec4(mix(col, uFog, f), a); }`
			})
		);
		const water = new THREE.Mesh(this.track(new THREE.PlaneGeometry(PW, PL, 60, 120)), waterMat);
		water.rotation.x = -PI / 2;
		water.position.y = WATER;
		s.add(water);

		// lignes d'eau
		const floatGeo = this.track(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10));
		floatGeo.rotateX(PI / 2);
		const ropes = [-3.6, -1.2, 1.2, 3.6], perRope = 98;
		const floats = new THREE.InstancedMesh(floatGeo, this.track(new THREE.MeshStandardMaterial({ roughness: 0.4 })), ropes.length * perRope);
		const M = new THREE.Matrix4(), C = new THREE.Color();
		ropes.forEach((x, ri) => {
			for (let i = 0; i < perRope; i++) {
				const z = -PL / 2 + 0.25 + i * 0.25;
				M.makeTranslation(x, WATER + 0.02, z);
				floats.setMatrixAt(ri * perRope + i, M);
				floats.setColorAt(ri * perRope + i, C.set(Math.abs(z) > PL / 2 - 5 ? 0x9a0010 : i % 2 ? 0xf2f2ee : 0x1a1a19));
			}
		});
		s.add(floats);

		// échelles
		const chrome = this.track(new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 1, roughness: 0.18 }));
		const ladder = (x: number, z: number, dir: number) => {
			const g = new THREE.Group();
			for (const o of [-0.3, 0.3]) {
				const c = new THREE.CatmullRomCurve3([
					new THREE.Vector3(o, -1.4, -0.12 * dir),
					new THREE.Vector3(o, 0.2, -0.12 * dir),
					new THREE.Vector3(o, 0.85, -0.05 * dir),
					new THREE.Vector3(o, 0.7, 0.35 * dir),
					new THREE.Vector3(o, 0, 0.45 * dir)
				]);
				g.add(new THREE.Mesh(this.track(new THREE.TubeGeometry(c, 40, 0.03, 8)), chrome));
			}
			for (let i = 0; i < 3; i++) {
				const rung = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.6, 0.03, 0.1)), chrome);
				rung.position.set(0, -1.2 + i * 0.4, -0.14 * dir);
				g.add(rung);
			}
			g.position.set(x, 0, z);
			room.add(g);
		};
		ladder(-4.6, -PL / 2, -1);
		ladder(4.6, PL / 2, 1);

		// règlement (texte posé plus tard par setRules) et marquages de profondeur
		this.rulesMat = this.track(new THREE.MeshStandardMaterial({ roughness: 0.6 }));
		const rules = new THREE.Mesh(this.track(new THREE.PlaneGeometry(5, 2.5)), this.rulesMat);
		rules.position.set(0, 4.2, -RL / 2 + 0.02);
		room.add(rules);
		const depth = (t: string, x: number, z: number, ry: number) => {
			const tex = this.track(signTexture([{ t, f: '600 150px "Barlow Semi Condensed", Arial', x: 256, y: 165, a: 'center', c: '#9a0010' }], 512, 220, '#ecece8'));
			const m = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1.4, 0.6)), this.track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 })));
			m.rotation.set(-PI / 2, 0, ry);
			m.position.set(x, 0.085, z);
			room.add(m);
		};
		depth('2,10 M', -PW / 2 - 0.85, 0, PI / 2);
		depth('2,10 M', PW / 2 + 0.85, 0, -PI / 2);
		depth('1,20 M', -PW / 2 - 0.85, 10, PI / 2);
		depth('1,20 M', PW / 2 + 0.85, -10, -PI / 2);
		const wallDepth = this.track(signTexture([{ t: '2,10', f: '600 300px "Barlow Semi Condensed", Arial', x: 256, y: 290, a: 'center', c: '#9a0010' }], 512, 360, '#ecece8'));
		for (const sgn of [-1, 1]) {
			const m = new THREE.Mesh(this.track(new THREE.PlaneGeometry(2.2, 1.55)), this.track(new THREE.MeshStandardMaterial({ map: wallDepth, roughness: 0.35 })));
			m.position.set(sgn * (RW / 2 - 0.02), 2.6, 0);
			m.rotation.y = -sgn * PI / 2;
			room.add(m);
		}

		// néons, dont un qui grésille
		const neonGeo = this.track(new THREE.BoxGeometry(0.32, 0.08, 3.2));
		const neon = this.track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
		this.flick = this.track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
		for (let i = 0; i < 5; i++)
			for (let j = 0; j < 3; j++) {
				const m = new THREE.Mesh(neonGeo, i === 2 && j === 1 ? this.flick : neon);
				m.position.set(-8 + j * 8, RH - 0.08, -16 + i * 8);
				room.add(m);
			}

		// Intensités ×π : three.js utilise désormais des unités physiques
		s.add(new THREE.HemisphereLight(0xffffff, 0xb9b9b2, 0.75 * PI));
		const sun = new THREE.DirectionalLight(0xffffff, 0.9 * PI);
		sun.position.set(3, RH - 0.5, 4);
		const fill = new THREE.DirectionalLight(0xffffff, 0.55 * PI);
		fill.position.set(-5, 3, -6);
		const above = new THREE.PointLight(0xffffff, 0.55 * PI, 12, 0);
		above.position.set(-2, HEART_Y + 3, 2);
		const redBounce = new THREE.PointLight(0xff1020, 0.6 * PI, 6, 0);
		redBounce.position.set(0, WATER + 0.3, 0);
		s.add(sun, fill, above, redBounce);
	}

	private buildHeart() {
		this.heartRoot.position.y = HEART_Y;
		this.heartRoot.add(this.beatGroup);
		this.scene.add(this.heartRoot);
		const geo = this.track(heartGeometry(56));
		const mat = this.track(new THREE.MeshStandardMaterial({ color: 0xa3000f, emissive: 0x220003, roughness: 0.42, metalness: 0 }));
		const uTime = this.uTime;
		// ondulation de la chair calculée sur le GPU, normales recalculées par différences finies
		mat.onBeforeCompile = (sh) => {
			sh.uniforms.uTime = uTime;
			sh.vertexShader =
				`uniform float uTime;
				float disp(vec3 p){ return .012*sin(p.x*3.1+uTime*.9)*sin(p.y*2.7-uTime*.8) + .006*sin(p.z*4.+p.y*2.+uTime*1.3); }
				` +
				sh.vertexShader
					.replace(
						'#include <beginnormal_vertex>',
						`vec3 nb = normalize(normal);
						vec3 tg = normalize(cross(nb, abs(nb.y) < .99 ? vec3(0.,1.,0.) : vec3(1.,0.,0.))); vec3 bt = cross(nb, tg);
						vec3 p0 = position + nb*disp(position);
						vec3 p1 = position + tg*.01; p1 += nb*disp(p1);
						vec3 p2 = position + bt*.01; p2 += nb*disp(p2);
						vec3 objectNormal = normalize(cross(p1-p0, p2-p0)); if (dot(objectNormal, nb) < 0.) objectNormal = -objectNormal;`
					)
					.replace('#include <begin_vertex>', 'vec3 transformed = position + normal*disp(position);');
		};
		this.heartMesh = new THREE.Mesh(geo, mat);
		this.heartMesh.scale.setScalar(1.2);
		this.beatGroup.add(this.heartMesh);
	}

	private buildSkins() {
		const pmrem = new THREE.PMREMGenerator(this.renderer);
		const env = this.track(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
		pmrem.dispose();
		this.skinMat = this.track(new THREE.MeshStandardMaterial({ envMap: env }));
		this.haloMat = this.track(new THREE.MeshStandardMaterial({ envMap: env }));
		const skinMat = this.skinMat, haloMat = this.haloMat;
		const redMat = this.track(new THREE.MeshStandardMaterial({ color: 0x9a0010, roughness: 0.5 }));
		const add = (k: Skin, g: THREE.Group) => {
			g.visible = false;
			this.skins[k] = g;
			this.beatGroup.add(g);
		};

		{
			const g = new THREE.Group();
			g.add(new THREE.Mesh(this.track(new THREE.CylinderGeometry(0.028, 0.028, 4.4, 10)), skinMat));
			const tip = new THREE.Mesh(this.track(new THREE.ConeGeometry(0.09, 0.32, 4)), skinMat);
			tip.position.y = 2.35;
			g.add(tip);
			for (let i = 0; i < 3; i++) {
				const f = new THREE.Mesh(this.track(new THREE.BoxGeometry(0.006, 0.55, 0.16)), redMat);
				f.position.y = -1.95;
				f.rotation.y = (i * PI * 2) / 3;
				f.translateZ(0.08);
				g.add(f);
			}
			g.rotation.set(0.25, 0, -1.05);
			add('arrow', g);
		}
		{
			const feather = (len: number, w: number) => {
				const s = new THREE.Shape();
				s.moveTo(0, 0);
				s.bezierCurveTo(w, len * 0.15, w * 0.9, len * 0.8, 0, len);
				s.bezierCurveTo(-w * 0.5, len * 0.7, -w * 0.5, len * 0.2, 0, 0);
				return this.track(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 16 }));
			};
			const wing = () => {
				const w = new THREE.Group();
				for (let i = 0; i < 9; i++) {
					const m = new THREE.Mesh(feather(1.1 + i * 0.13 - (i > 6 ? (i - 6) * 0.25 : 0), 0.2), skinMat);
					m.rotation.z = -1.35 + i * 0.17;
					m.position.z = -i * 0.012;
					w.add(m);
				}
				for (let i = 0; i < 6; i++) {
					const m = new THREE.Mesh(feather(0.55 + i * 0.05, 0.14), skinMat);
					m.rotation.z = -1.1 + i * 0.22;
					m.position.set(0.05, 0.1, 0.02);
					w.add(m);
				}
				return w;
			};
			const L = new THREE.Group(), R = new THREE.Group();
			const wl = wing();
			wl.scale.x = -1;
			L.add(wl);
			R.add(wing());
			L.position.set(-0.85, 0.45, -0.35);
			R.position.set(0.85, 0.45, -0.35);
			const g = new THREE.Group();
			g.add(L, R);
			this.skinUpdates.wings = (t) => {
				const a = 0.25 + 0.3 * Math.sin(t * 3);
				L.rotation.y = a;
				R.rotation.y = -a;
			};
			add('wings', g);
		}
		{
			const g = new THREE.Group();
			const halo = new THREE.Mesh(this.track(new THREE.TorusGeometry(0.55, 0.035, 12, 64)), haloMat);
			halo.rotation.x = PI / 2 - 0.2;
			halo.position.y = 1.5;
			const glow = new THREE.PointLight(0xffffff, 0.6 * PI, 3, 0);
			glow.position.y = 1.5;
			g.add(halo, glow);
			this.skinUpdates.halo = (t) => {
				const on = Math.sin(t * 13) > -0.85 || Math.sin(t * 0.9) < 0.9;
				haloMat.emissiveIntensity = on ? 1 : 0.1;
				glow.intensity = on ? 0.6 * PI : 0;
			};
			add('halo', g);
		}
		{
			class Wire extends THREE.Curve<THREE.Vector3> {
				constructor(private ph: number) {
					super();
				}
				getPoint(u: number, target = new THREE.Vector3()) {
					const a = u * PI * 2, R = 1.42, k = 0.045, tw = a * 28 + this.ph;
					return target.set(Math.cos(a) * (R + k * Math.cos(tw)), k * Math.sin(tw), Math.sin(a) * (R + k * Math.cos(tw)));
				}
			}
			const g = new THREE.Group();
			g.add(
				new THREE.Mesh(this.track(new THREE.TubeGeometry(new Wire(0), 600, 0.013, 6, true)), skinMat),
				new THREE.Mesh(this.track(new THREE.TubeGeometry(new Wire(PI), 600, 0.013, 6, true)), skinMat)
			);
			const barbGeo = this.track(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 4));
			for (let i = 0; i < 26; i++) {
				const a = (i / 26) * PI * 2, b = new THREE.Group();
				b.position.set(Math.cos(a) * 1.42, 0, Math.sin(a) * 1.42);
				b.rotation.y = -a;
				for (const j of [0, 1]) {
					const sp = new THREE.Mesh(barbGeo, skinMat);
					sp.rotation.set(j ? 0.9 : -0.9, 0, 0.6);
					b.add(sp);
				}
				g.add(b);
			}
			g.rotation.set(0.35, 0, -0.25);
			g.position.y = 0.05;
			add('barbed', g);
		}
		{
			const ring = new THREE.Group();
			for (let i = 0; i < 8; i++) {
				const seg = new THREE.Mesh(this.track(new THREE.TorusGeometry(1.15, 0.26, 24, 16, PI / 4)), i % 2 ? redMat : skinMat);
				seg.rotation.z = (i * PI) / 4;
				ring.add(seg);
			}
			ring.rotation.x = PI / 2 + 0.15;
			ring.position.y = -0.25;
			const g = new THREE.Group();
			g.add(ring);
			add('buoy', g);
		}
	}

	/** Texte du panneau « Règlement du bassin », dans la langue courante. */
	setRules(title: string, lines: string[]) {
		const draw = () => {
			const tex = signTexture(
				[
					{ t: title.toUpperCase(), f: '600 46px "Barlow Semi Condensed", Arial', x: 50, y: 90 },
					...lines.map((t, i) => ({
						t: `${i + 1}. ${t}`,
						f: `${i === lines.length - 1 ? 600 : 400} 40px Barlow, Arial`,
						x: 50,
						y: 180 + i * 65,
						c: i === lines.length - 1 ? '#9a0010' : '#111'
					})),
					{ t: 'Dark Léa from the Bocal', f: 'italic 400 28px Barlow, Arial', x: 50, y: 450, c: '#666' }
				],
				1024,
				512,
				'#f4f4f0',
				true
			);
			this.rulesMat.map?.dispose();
			this.rulesMat.map = tex;
			this.rulesMat.needsUpdate = true;
		};
		draw();
		document.fonts?.ready.then(draw);
	}

	setSkin(skin: Skin, finish: Finish) {
		this.skin = skin;
		for (const [k, g] of Object.entries(this.skins)) g!.visible = k === skin;
		const gold = finish !== 'noir';
		for (const m of [this.skinMat, this.haloMat]) {
			m.color.set(gold ? 0xd2a43a : 0x0b0b0a);
			m.metalness = gold ? 1 : 0.55;
			m.roughness = gold ? 0.26 : 0.32;
		}
		this.haloMat.emissive.set(gold ? 0x8a5f10 : 0x000000);
	}

	/** Un panneau de contenu est ouvert : le coeur se décale pour ne pas être caché. */
	setPanel(open: boolean) {
		this.panel = open;
		if (open) this.select(-1);
		// arrivée directe sur un panneau : pas de travelling d'intro ni de glissement, tout est déjà en place
		if (this.readyAt < 0) {
			this.panelK = open ? 1 : 0;
			if (open) {
				this.introDone = true;
				this.camera.position.copy(this.introTo);
			}
		}
	}

	setNetwork(net: Network) {
		// même réseau (mêmes personnes, mêmes fils) : on garde les objets 3D, seules les infos des fiches changent
		const key = net.nodes.map((n) => `${n.id}${n.me ? '*' : ''}`).join(',') + '|' + net.links.join(';');
		this.net = net;
		if (key === this.netKey && this.nodes) return;
		this.netKey = key;
		this.selected = -1;
		for (const o of [this.nodes, this.nodeEdges, this.links]) {
			if (o) {
				this.scene.remove(o);
				o.geometry.dispose();
				(o.material as THREE.Material).dispose();
			}
		}
		const n = net.nodes.length;
		this.positions = net.nodes.map((node) => {
			const r = prng(node.id + 7);
			const inside = r() < 0.2, rad = inside ? 0.3 + r() * 0.9 : 2.2 + r() * 4.2;
			const th = r() * PI * 2, ph = Math.acos(2 * r() - 1);
			const p = new THREE.Vector3(rad * Math.sin(ph) * Math.cos(th), HEART_Y + rad * Math.cos(ph) * 0.75, rad * Math.sin(ph) * Math.sin(th));
			if (p.y < WATER + 0.35) p.y = WATER + 0.35 + r() * 0.5;
			return p;
		});
		const poly = new THREE.IcosahedronGeometry(1, 0);
		this.nodes = new THREE.InstancedMesh(poly, new THREE.MeshStandardMaterial({ roughness: 0.55, flatShading: true }), Math.max(1, n));
		this.nodeEdges = new THREE.InstancedMesh(poly.clone(), new THREE.MeshBasicMaterial({ color: 0x0d0d0c, wireframe: true }), Math.max(1, n));
		this.nodes.count = this.nodeEdges.count = n;
		const M = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
		net.nodes.forEach((node, i) => {
			const r = prng(node.id + 99);
			q.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6));
			sc.setScalar((node.me ? 0.16 : 0.09) + r() * 0.04);
			M.compose(this.positions[i], q, sc);
			this.nodes!.setMatrixAt(i, M);
			sc.multiplyScalar(1.01);
			M.compose(this.positions[i], q, sc);
			this.nodeEdges!.setMatrixAt(i, M);
			this.nodes!.setColorAt(i, new THREE.Color(this.baseColor(i)));
		});
		const index = new Map(net.nodes.map((nd, i) => [nd.id, i]));
		const pos: number[] = [];
		for (const [a, b] of net.links) {
			const A = this.positions[index.get(a)!], B = this.positions[index.get(b)!];
			if (A && B) pos.push(A.x, A.y, A.z, B.x, B.y, B.z);
		}
		const lg = new THREE.BufferGeometry();
		lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		this.links = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2a2a28, transparent: true, opacity: 0.38 }));
		this.scene.add(this.nodes, this.nodeEdges, this.links);
		this.hiLinks.geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
	}

	private baseColor(i: number) {
		return this.net.nodes[i]?.me ? 0xb8000f : 0xbdbdb7;
	}

	select(i: number) {
		if (!this.nodes) return;
		if (this.selected >= 0) this.nodes.setColorAt(this.selected, new THREE.Color(this.baseColor(this.selected)));
		this.selected = i;
		const ep: number[] = [];
		if (i >= 0) {
			this.nodes.setColorAt(i, new THREE.Color(0xb8000f));
			const id = this.net.nodes[i].id;
			const index = new Map(this.net.nodes.map((nd, k) => [nd.id, k]));
			for (const [a, b] of this.net.links)
				if (a === id || b === id) {
					const A = this.positions[index.get(a)!], B = this.positions[index.get(b)!];
					ep.push(A.x, A.y, A.z, B.x, B.y, B.z);
				}
		}
		if (this.nodes.instanceColor) this.nodes.instanceColor.needsUpdate = true;
		this.hiLinks.geometry.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
		this.opts.onSelect(i >= 0 ? this.net.nodes[i] : null);
	}

	private setMouse(e: PointerEvent) {
		const r = this.canvas.getBoundingClientRect();
		this.mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
		this.ray.setFromCamera(this.mouse, this.camera);
	}
	private onDown = (e: PointerEvent) => {
		this.down = [e.clientX, e.clientY];
		this.introDone = true;
	};
	private onUp = (e: PointerEvent) => {
		if (!this.down || Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 5 || this.panel || !this.nodes) return;
		this.setMouse(e);
		const hit = this.ray.intersectObject(this.nodes)[0];
		if (hit && hit.instanceId !== undefined) this.select(hit.instanceId);
	};
	private onMove = (e: PointerEvent) => {
		if (e.buttons || this.panel) return;
		this.setMouse(e);
		this.hover = this.ray.intersectObject(this.heartMesh).length > 0;
		const overNode = !!this.nodes && this.ray.intersectObject(this.nodes).length > 0;
		this.canvas.style.cursor = this.hover || overNode ? 'pointer' : '';
	};
	private onLeave = () => {
		this.hover = false;
	};

	private resize = () => {
		const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
		if (!w || !h) return;
		this.renderer.setSize(w, h, false);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	};

	private introFrom = new THREE.Vector3(0, 2.8, 17);
	private introTo = new THREE.Vector3(0, 2.3, 8.2);

	private loop = () => {
		this.raf = requestAnimationFrame(this.loop);
		this.timer.update();
		const t = this.timer.getElapsed();
		const dt = Math.min(0.05, Math.max(0, t - this.lastT));
		this.lastT = t;
		this.animT += dt;
		const at = this.animT;
		const reduce = this.opts.reducedMotion;
		this.uTime.value = at;
		const cam = this.camera;
		if (!this.introDone) {
			const k = this.readyAt < 0 ? 0 : Math.min(1, (t - this.readyAt) / 3.2), e = 1 - Math.pow(1 - k, 3);
			cam.position.lerpVectors(this.introFrom, this.introTo, e);
			if (k >= 1) this.introDone = true;
		} else if (reduce && t < 0.1) cam.position.copy(this.introTo);

		// battement uniquement au survol : boum-boum doux
		this.hoverK += ((this.hover ? 1 : 0) - this.hoverK) * (1 - Math.exp(-dt * 5));
		this.beatPh = (this.beatPh + dt / 1.25) % 1;
		const ph = this.beatPh, amp = 1.1 * this.hoverK;
		this.beatGroup.scale.setScalar(1 + amp * (0.035 * Math.exp(-(((ph - 0.12) / 0.07) ** 2)) + 0.022 * Math.exp(-(((ph - 0.34) / 0.08) ** 2))));
		if (!reduce) {
			this.heartRoot.rotation.y = at * 0.3;
			this.heartRoot.position.y = HEART_Y + Math.sin(at * 0.6) * 0.06;
			this.skinUpdates[this.skin]?.(at);
			this.flick.color.setScalar(Math.sin(at * 17) > 0.2 && Math.sin(at * 1.3) > -0.7 ? 1 : 0.25);
		}

		const w = this.canvas.clientWidth, h = this.canvas.clientHeight, wide = w > 760;
		// glissement à durée fixe (0,9 s, accéléré puis freiné), indépendant de la fréquence de l'écran
		const step = reduce ? 1 : dt / 0.9;
		this.panelK = this.panel ? Math.min(1, this.panelK + step) : Math.max(0, this.panelK - step);
		const k = this.panelK, e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
		const offX = wide ? -w * 0.2 * e : 0, offY = wide ? 0 : h * 0.2 * e;
		if (Math.abs(offX) > 0.5 || Math.abs(offY) > 0.5) cam.setViewOffset(w, h, offX, offY, w, h);
		else if (cam.view) cam.clearViewOffset();

		this.controls.update();
		cam.position.x = THREE.MathUtils.clamp(cam.position.x, -RW / 2 + 0.5, RW / 2 - 0.5);
		cam.position.z = THREE.MathUtils.clamp(cam.position.z, -RL / 2 + 0.5, RL / 2 - 0.5);
		cam.position.y = THREE.MathUtils.clamp(cam.position.y, WATER + 0.25, RH - 0.5);
		this.renderer.render(this.scene, cam);
		if (this.readyAt < 0 && this.nodes) {
			this.readyAt = t;
			this.opts.onReady();
		}
	};

	dispose() {
		cancelAnimationFrame(this.raf);
		removeEventListener('resize', this.resize);
		this.canvas.removeEventListener('pointerdown', this.onDown);
		this.canvas.removeEventListener('pointerup', this.onUp);
		this.canvas.removeEventListener('pointermove', this.onMove);
		this.canvas.removeEventListener('pointerleave', this.onLeave);
		this.controls.dispose();
		this.timer.dispose();
		this.disposables.forEach((d) => d.dispose());
		this.rulesMat.map?.dispose();
		this.renderer.dispose();
	}
}
