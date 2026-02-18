# Napoleon Prototype (Unity MVP Vertical Slice)

## Empfohlene Unity-Version
- Unity **2022.3 LTS** (Built-in Render Pipeline ist ausreichend).
- Plattform: PC (Standalone).

## Ziel der ersten lauffähigen Version
- Menü → Mission laden → Intro bestätigen → spielen.
- Third-Person-Napoleon steuerbar.
- 2 Teams (Blau/Rot), Capture Points, Score, Timer, Army-Wipe-Ende.

## Ordnerstruktur
- `Assets/Scenes`
  - `Scene_MainMenu`
  - `Scene_Mission1`
- `Assets/Scripts/Core`
  - `GameTeam.cs`
  - `Health.cs`
- `Assets/Scripts/Gameplay`
  - `GameManager.cs`
  - `CapturePoint.cs`
- `Assets/Scripts/Player`
  - `PlayerController.cs`
  - `ThirdPersonCamera.cs`
- `Assets/Scripts/AI`
  - `UnitAI.cs`
  - `SquadCommander.cs`
- `Assets/Scripts/UI`
  - `UIManager.cs`
- `Assets/Prefabs`
  - `PF_Player_Napoleon`
  - `PF_Unit_Blue`
  - `PF_Unit_Red`
  - `PF_CapturePoint`
  - `PF_GameManager`
- `Assets/UI`
  - Canvas Prefabs / TMP Assets

## Input-Annahmen (legacy Input Manager)
- Bewegung: `WASD`
- Kamera: Maus X/Y
- Sprint: `LeftShift`
- Sprung: `Space`
- Nahkampf: `Mouse0`
- Fernkampf: `Mouse1`
- Squad-Befehle: `1` Angriff, `2` Rückzug, `3` Halten
- Missionsstart: `Enter`

## Schritt-für-Schritt Setup

### 1) Szenen anlegen
1. Lege `Scene_MainMenu` an und speichere unter `Assets/Scenes`.
2. Lege `Scene_Mission1` an und speichere unter `Assets/Scenes`.
3. Füge beide in **Build Settings** hinzu (Reihenfolge: MainMenu, Mission1).

### 2) Main Menu bauen
1. In `Scene_MainMenu`:
   - Erstelle `Canvas` + `EventSystem`.
   - UI: Titel-Text, Button **Start Mission**, Button **Quit**.
2. Hänge `UIManager` an ein leeres Objekt `UI_MainMenu`.
3. Im `UIManager`:
   - `Main Menu Root` = Menü-Panel.
   - `Mission Scene Name` = `Scene_Mission1`.
4. Button-Events:
   - Start → `UIManager.OnStartMissionPressed()`
   - Quit → `UIManager.OnQuitPressed()`

### 3) Mission Scene Grundaufbau
1. In `Scene_Mission1`:
   - Plane (ca. 200x200) als Boden.
   - Optional Hügel/Wände als primitive Deckung.
   - Licht + leichter Fog (Window > Rendering > Lighting).
2. Erstelle `GameObject` `GameManager` + Script `GameManager`.

### 4) Player/Napoleon Prefab
1. Capsule erstellen: `PF_Player_Napoleon`.
2. Komponenten:
   - `CharacterController`
   - `Health` (Team = Blue, `isNapoleon = true`)
   - `PlayerController`
3. Child-Camera-Rig:
   - `Main Camera` + `ThirdPersonCamera`.
   - `ThirdPersonCamera.target` auf den Player setzen.
4. Optional Weapon-Muzzle-Transform für später.

### 5) Unit Prefabs (Blau/Rot)
1. Capsule/Cube erstellen (`PF_Unit_Blue`, `PF_Unit_Red`).
2. Komponenten:
   - `NavMeshAgent`
   - `Health` (Team entsprechend)
   - `UnitAI`
3. Materialfarbe:
   - Blau-Team blau, Rot-Team rot.

### 6) Squad Commander
1. Leeres Objekt `PlayerSquadCommander` in Mission.
2. `SquadCommander` anhängen.
3. `controlledUnits` mit den **blauen** Units füllen.
4. `retreatPoint` auf einen Transform bei eigener Basis setzen.

### 7) Capture Points (A/B/C)
1. Für jeden Punkt leeres Objekt `CP_A`, `CP_B`, `CP_C`.
2. Komponenten:
   - `CapturePoint`
   - `SphereCollider` (`isTrigger = true`, Radius z. B. 8).
3. Child-Objekt als Flag (Cube/Cylinder) + Renderer im `flagRenderer` referenzieren.
4. `pointId` auf A/B/C setzen.

### 8) NavMesh backen
1. Markiere Boden/Geometrie als `Navigation Static`.
2. **Window > AI > Navigation** öffnen.
3. Agent Radius/Höhe sinnvoll einstellen (Default reicht meist).
4. `Bake` drücken.
5. Prüfen: Units bewegen sich über blaue NavMesh-Fläche.

### 9) Mission UI
1. Canvas erstellen mit Panels:
   - `IntroOverlay` (Steuerung/Siegbedingungen)
   - `HUD` (Timer, Score, Point Status, Player HP)
   - `EndPanel` (Sieg/Niederlage)
2. `UIManager` auf `UI_Mission` Objekt:
   - `introOverlayRoot`, `hudRoot`, `endPanel` zuweisen.
   - TMP-Textfelder (`timerText`, `scoreText`, `pointStatusText`, `playerHpText`, `endText`) zuweisen.
   - `playerHealth` = Napoleon Health.

### 10) Audio (Platzhalter)
1. Lege 3–5 kurze freie Platzhalter-Sounds ins Projekt.
2. Optional AudioSource auf Player/Units/CapturePoints.
3. Trigger später in Combat/Capture Events einklinken.

## Benötigte Tags/Layers
Minimal nötig:
- Keine Pflicht-Tags erforderlich (Scripts arbeiten komponentenbasiert).
- Optional Layer:
  - `Units`
  - `Environment`
  - `Player`
  - Für `PlayerController.hitMask` konfigurierbar.

## Balancing-Startwerte (Inspector)
- Mission-Dauer: 1800 Sekunden (Test: 300).
- Capture-Dauer pro Punkt: 10 Sekunden.
- Score pro Punkt/Sekunde: 1.
- Kill Score: 10.

## Bekannte MVP-Grenzen
- Placeholder-Modelle ohne historische Meshes/Animationen.
- Sehr einfache FSM-KI.
- Keine Formationen/keine komplexe Ballistik.

## Next Steps (Update 2)
- Historische Einheiten-Typen (Linieninfanterie, Kavallerie, Artillerie).
- Datengetriebene Configs via ScriptableObjects (Uniformen, Waffen, HP, Damage).
- Verbesserte Formationslogik + Flankenverhalten.
- Animationen/VFX/SFX passender zur Epoche.
