# Space Shooter

Juego arcade vertical tipo shoot'em up construido con **Phaser 4** + **TypeScript** + **Vite**.

El jugador controla una nave arrastrándola con el dedo/mouse, dispara automáticamente, destruye oleadas de enemigos, esquiva impactos, gana puntos/monedas y sobrevive hasta que pierde toda la vida.

## Requisitos

- Node.js >= 22 (proyecto usa `.nvmrc`)
- npm >= 10

## Inicio rápido

```bash
# Usar la versión de Node correcta
nvm use

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## Stack tecnológico

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Phaser | 4.1.0 | Motor de juego 2D |
| TypeScript | ~6.0 | Tipado estático |
| Vite | 8.x | Build tool + HMR |

## Estructura del proyecto

```
space-shooter/
├── public/
│   └── assets/
│       ├── images/
│       │   ├── player/          # Naves del jugador
│       │   ├── enemies/         # Sprites de enemigos
│       │   ├── bullets/         # Lásers y proyectiles
│       │   ├── explosions/      # Efectos de explosión
│       │   ├── ui/              # Power-ups, iconos UI
│       │   └── backgrounds/     # Fondos espaciales
│       ├── audio/sfx/           # Efectos de sonido
│       └── fonts/               # Fuentes del juego
├── src/
│   ├── main.ts                  # Entry point + config Phaser
│   ├── config/
│   │   ├── game.config.ts       # Constantes del juego
│   │   └── waves.config.ts      # Definición de oleadas y enemigos
│   ├── scenes/
│   │   ├── BootScene.ts         # Carga de assets + loading bar
│   │   ├── MenuScene.ts         # Pantalla de inicio
│   │   ├── GameScene.ts         # Loop principal del juego
│   │   └── GameOverScene.ts     # Pantalla fin de partida
│   ├── entities/
│   │   ├── Player.ts            # Nave jugador (drag, disparo, vida)
│   │   └── Enemy.ts             # Enemigos + object pooling
│   ├── systems/
│   │   ├── WaveManager.ts       # Gestión de oleadas
│   │   ├── CollisionManager.ts  # Detección de colisiones
│   │   └── ScoreManager.ts      # Puntuación y monedas
│   └── ui/
│       └── HUD.ts               # Interfaz en pantalla
├── index.html
├── package.json
├── tsconfig.json
└── .nvmrc
```

## Arquitectura y patrones de diseño

### Scene Manager (Patrón State Machine)
Cada pantalla del juego es una `Scene` independiente de Phaser:
- `BootScene` → `MenuScene` → `GameScene` ↔ `GameOverScene`

### Object Pooling
Las balas (`Phaser.Physics.Arcade.Group`) y enemigos se reutilizan via pools para evitar allocations constantes — crítico para rendimiento en mobile.

### Data-Driven Waves
Las oleadas se definen declarativamente en `waves.config.ts` con tipo de enemigo, cantidad, formación y tiempos. Pasada la oleada 10, se generan proceduralmente con dificultad escalada.

### Separation of Concerns
- **Entities**: lógica individual (Player, Enemy)
- **Systems**: lógica de juego (waves, collisions, scoring)
- **UI**: presentación (HUD)
- **Config**: datos puros

### Responsive Design
- `Phaser.Scale.FIT` adapta el canvas a cualquier pantalla
- Touch input nativo para mobile (drag-to-move)
- Viewport meta tag con `user-scalable=no`

## Tipos de enemigos

| Tipo | HP | Velocidad | Puntos | Dispara |
|------|----|-----------|--------|---------|
| Black | 1 | 80 | 100 | No |
| Blue | 2 | 100 | 150 | Sí (2s) |
| Green | 3 | 60 | 200 | Sí (1.5s) |
| Red | 5 | 50 | 300 | Sí (1.2s) |

## Formaciones

- `line`: enemigos en línea horizontal
- `v-shape`: formación en V
- `grid`: cuadrícula
- `random`: posiciones aleatorias

## Controles

- **Mobile**: arrastra el dedo para mover la nave
- **Desktop**: clic y arrastra con el mouse
- **Disparo**: automático continuo

## Assets

Sprites y sonidos de [Kenney.nl](https://kenney.nl) — licencia CC0 (dominio público).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (TypeScript + Vite) |
| `npm run preview` | Preview del build de producción |
