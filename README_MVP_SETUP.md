# Napoleon Prototype (Unity 6 MVP)

## Status
Dieses Repository enthält jetzt ein vollständiges Unity-6-Projektlayout mit:
- `ProjectSettings/`
- `Packages/`
- `Assets/` inkl. `Scenes`, `Scripts` und `.meta` Dateien.

## Szenen
- `Assets/Scenes/Scene_MainMenu.unity` (Startszene)
- `Assets/Scenes/Scene_Mission1.unity`

## Wichtige Defaults
- Built-in Render Pipeline (kein URP/HDRP)
- Legacy Input Manager (Horizontal/Vertical/Mouse X/Mouse Y)
- Timer: `1800`
- Capture Duration: `10`
- Score pro Punkt/Sekunde: `1`
- Kill Score: `10`

## Steuerung
- WASD: Bewegung
- Shift: Sprint
- Space: Springen
- LMB: Nahkampf
- RMB: Fernkampf
- 1/2/3: Squad Befehle
- Enter: Missionsstart (und MainMenu-Quickstart)

## Navigation / Bake
Falls AI sich nicht bewegt: siehe `BAKE_NAVMESH.md`.

## Validierung
Im Unity Editor:
- `Tools/Napoleon MVP/Validate Setup`
