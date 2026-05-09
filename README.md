# Space Shooter

Juego arcade vertical tipo shoot'em up construido con **Phaser 4** + **TypeScript** + **Vite**.

El jugador controla una nave arrastrándola con el dedo/mouse o con las flechas del teclado, dispara automáticamente, destruye oleadas de enemigos, esquiva impactos, recoge power-ups, enfrenta bosses cada 5 oleadas y sobrevive hasta que pierde toda la vida.

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
├── public/assets/
│   ├── images/
│   │   ├── player/              # Naves del jugador (6 niveles)
│   │   ├── enemies/             # Sprites de enemigos (4 colores × 5 variantes)
│   │   ├── bullets/             # Lásers y proyectiles
│   │   ├── explosions/          # Efectos de explosión
│   │   ├── ui/                  # Power-ups, iconos UI
│   │   └── backgrounds/         # Fondos espaciales
│   └── audio/sfx/               # Efectos de sonido
├── src/
│   ├── main.ts                  # Entry point + config Phaser
│   ├── config/
│   │   ├── game.config.ts       # Constantes, daños, progresión, accesibilidad
│   │   └── waves.config.ts      # Oleadas, enemigos y bosses
│   ├── scenes/
│   │   ├── BootScene.ts         # Carga de assets + loading bar
│   │   ├── MenuScene.ts         # Menú principal + opciones accesibilidad
│   │   ├── GameScene.ts         # Loop principal (orquestador)
│   │   └── GameOverScene.ts     # Pantalla fin de partida
│   ├── entities/
│   │   ├── Player.ts            # Nave jugador (drag + teclado, disparo, escudo)
│   │   ├── Enemy.ts             # Enemigos con disparo dirigido al jugador
│   │   ├── Boss.ts              # Bosses con fases, patrones y movimiento
│   │   ├── PowerUp.ts           # Power-ups (gun, health, bomb, shield)
│   │   └── pools.ts             # Factories de object pools centralizadas
│   ├── systems/
│   │   ├── WaveManager.ts       # Gestión de oleadas + escalado procedural
│   │   ├── CollisionManager.ts  # Colisiones (enemigos, boss, power-ups)
│   │   ├── BossManager.ts       # Spawn y gestión de bosses
│   │   ├── BombManager.ts       # Lógica de bombas (limpia pantalla)
│   │   ├── ProgressionManager.ts# Level-up de nave por monedas
│   │   └── ScoreManager.ts      # Puntuación, combo y monedas
│   └── ui/
│       └── HUD.ts               # Interfaz en pantalla (responsiva)
├── index.html
├── package.json
├── tsconfig.json
└── .nvmrc
```

## Arquitectura y patrones de diseño

### Scene Manager (Patrón State Machine)
Cada pantalla del juego es una `Scene` independiente de Phaser:
- `BootScene` → `MenuScene` → `GameScene` ↔ `GameOverScene`
- Pausa in-game con overlay (ESC o botón ||)

### Object Pooling
Balas, enemigos y power-ups se reutilizan vía pools (`pools.ts`) para evitar allocations — crítico en mobile.

### Data-Driven Waves
Las oleadas se definen declarativamente en `waves.config.ts` con tipo de enemigo, cantidad, formación y tiempos. Pasada la oleada definida, se generan proceduralmente con dificultad escalada (+40% HP, +8% velocidad, -8% cooldown por tier).

### Boss System
Cada 5 oleadas aparece un boss con fases basadas en HP (cambios de patrón de disparo, velocidad y movimiento). 3 arquetipos (Raider, Destroyer, Overlord) que se repiten escalados cada 15 oleadas.

### Separation of Concerns
- **Entities**: lógica individual (`Player`, `Enemy`, `Boss`, `PowerUp`)
- **Systems**: lógica de juego (`WaveManager`, `CollisionManager`, `BossManager`, `BombManager`, `ProgressionManager`, `ScoreManager`)
- **UI**: presentación (`HUD`)
- **Config**: datos puros y constantes centralizadas

### Responsive Design
- `Phaser.Scale.FIT` adapta el canvas a cualquier pantalla
- HUD con posiciones derivadas de `GAME_HEIGHT` (no hardcodeadas)
- Touch input nativo para mobile (drag-to-move)
- Soporte completo de teclado (flechas + B + ESC)

## Tipos de enemigos

| Tipo | HP | Velocidad | Puntos | Cadencia | Comportamiento |
|------|----|-----------|--------|----------|----------------|
| Black | 4 | 95 | 100 | 3.5s | Recto |
| Blue | 6 | 105 | 150 | 1.7s | Onda sinusoidal |
| Green | 10 | 75 | 200 | 1.3s | Onda sinusoidal suave |
| Red | 14 | 55 | 300 | 1.1s | Recto, tanque |

Los enemigos disparan **hacia el jugador** con ~±10° de dispersión.

## Bosses

| Boss | HP base | Aparece | Fases |
|------|---------|---------|-------|
| Raider | 80 | Wave 5, 20, 35… | 2 (spread → aimed) |
| Destroyer | 130 | Wave 10, 25, 40… | 3 (spread → aimed → barrage) |
| Overlord | 200 | Wave 15, 30, 45… | 3 (spread → circle → barrage) |

HP y velocidad escalan +60% y +10% por ciclo de 15 oleadas.

## Power-ups

| Tipo | Icono | Color | Efecto |
|------|-------|-------|--------|
| Gun | ⚡ Rayo | Amarillo | Sube nivel de arma (hasta 5) |
| Health | 🛡 Escudo | Verde | Recupera 25 HP |
| Bomb | ⭐ Estrella | Rojo | +1 bomba (máx 4) |
| Shield | 🛡 Escudo grande | Azul | +3 hits de escudo |

Cada tipo usa una **textura diferente** para distinguirse sin depender solo del color.

## Formaciones

- `line` — enemigos en línea horizontal
- `v-shape` — formación en V
- `grid` — cuadrícula
- `random` — posiciones aleatorias

## Controles

| Input | Acción |
|-------|--------|
| Arrastrar (touch/mouse) | Mover nave |
| Flechas del teclado | Mover nave |
| B | Usar bomba |
| ESC | Pausar/reanudar |
| SPACE | Iniciar partida |
| Botón \|\| (HUD) | Pausar |

El disparo es automático continuo.

## Accesibilidad

- **Reducir efectos**: toggle en el menú principal que desactiva flashes de cámara y sacudidas (previene seizures)
- **Daltonismo**: power-ups diferenciados por forma además de color
- **Canvas ARIA**: `role="application"` y `aria-label` en el contenedor del juego
- **Tutorial**: overlay de controles en la primera partida
- **Tipografía**: fuente pixel "Press Start 2P" para legibilidad retro consistente

## Progresión de nave

La nave sube de nivel al acumular monedas:

| Nivel | Nombre | Monedas | Bonus |
|-------|--------|---------|-------|
| 1 | Fighter | — | — |
| 2 | Destroyer | 750 | +10 HP máx, gun level mín 2 |
| 3 | Warship | 1100 | +10 HP máx, gun level mín 3 |
| 4 | Golden Eagle | 1800 | +10 HP máx, gun level mín 4 |
| 5 | Phantom | 3000 | +10 HP máx, gun level mín 5 |
| 6 | Nemesis | 5000 | +10 HP máx |

## Assets

Sprites y sonidos de [Kenney.nl](https://kenney.nl) — licencia CC0 (dominio público).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción (TypeScript + Vite) |
| `npm run preview` | Preview del build de producción |
