import math
import random
from array import array
from collections import deque
from pathlib import Path

import pygame

SCREEN_WIDTH, SCREEN_HEIGHT = 960, 640
FPS = 60

TILE_SIZE = 32
GRID_W, GRID_H = 20, 14
GRID_X, GRID_Y = 32, 96

DIR_KEYS = {
    pygame.K_UP: (0, -1),
    pygame.K_DOWN: (0, 1),
    pygame.K_LEFT: (-1, 0),
    pygame.K_RIGHT: (1, 0),
}

AUDIO_NAMES = [
    "music_title",
    "music_game",
    "sfx_dig",
    "sfx_emerald",
    "sfx_gold_wobble",
    "sfx_gold_drop",
    "sfx_gold_collect",
    "sfx_shoot",
    "sfx_monster_die",
    "sfx_player_die",
    "sfx_bonus_start",
    "sfx_bonus_end",
    "sfx_level_clear",
]


class AudioManager:
    def __init__(self):
        self.music_enabled = True
        self.sfx_enabled = True
        self.music_volume = 0.55
        self.sfx_volume = 0.75

        self.original = Path("assets/original")
        self.fallback = Path("assets/fallback")
        self.original.mkdir(parents=True, exist_ok=True)
        self.fallback.mkdir(parents=True, exist_ok=True)

        self.music_paths: dict[str, Path] = {}
        self.sfx_cache: dict[str, pygame.mixer.Sound] = {}
        self.current_music = None

        for name in AUDIO_NAMES:
            path = self._resolve(name)
            if not path:
                continue
            try:
                if name.startswith("music_"):
                    self.music_paths[name] = path
                else:
                    snd = pygame.mixer.Sound(str(path))
                    snd.set_volume(self.sfx_volume)
                    self.sfx_cache[name] = snd
            except pygame.error:
                pass

    def _resolve(self, name: str):
        for base in (self.original, self.fallback):
            for ext in (".wav", ".ogg"):
                p = base / f"{name}{ext}"
                if p.exists():
                    return p
        return None

    def _tone(self, freq=440.0, duration=0.1, wave="square"):
        sr = 44100
        n = max(1, int(sr * duration))
        buf = array("h")
        amp = int(32767 * 0.35)
        for i in range(n):
            t = i / sr
            phase = (t * freq) % 1.0
            if wave == "square":
                val = 1.0 if phase < 0.5 else -1.0
            elif wave == "triangle":
                val = 4.0 * abs(phase - 0.5) - 1.0
            elif wave == "saw":
                val = 2.0 * phase - 1.0
            else:
                val = math.sin(2 * math.pi * freq * t)
            env = 1.0 - i / n
            buf.append(int(val * env * amp))
        snd = pygame.mixer.Sound(buffer=buf.tobytes())
        snd.set_volume(self.sfx_volume)
        return snd

    def _synth_sfx(self, name: str):
        spec = {
            "sfx_dig": (200, 0.05, "square"),
            "sfx_emerald": (820, 0.08, "triangle"),
            "sfx_gold_wobble": (140, 0.25, "sine"),
            "sfx_gold_drop": (100, 0.17, "square"),
            "sfx_gold_collect": (640, 0.13, "triangle"),
            "sfx_shoot": (520, 0.08, "square"),
            "sfx_monster_die": (290, 0.2, "saw"),
            "sfx_player_die": (160, 0.33, "saw"),
            "sfx_bonus_start": (960, 0.18, "triangle"),
            "sfx_bonus_end": (260, 0.2, "triangle"),
        }
        f, d, w = spec.get(name, (440, 0.1, "square"))
        return self._tone(f, d, w)

    def _synth_music(self, name: str):
        # tiny fallback jingle, no external assets
        base = 146 if name == "music_game" else 180
        seq = [1, 1.25, 1.5, 2, 1.5, 1.25, 1, 0.75]
        for i, m in enumerate(seq):
            s = self._tone(base * m, 0.18, "square" if i % 2 else "triangle")
            s.set_volume(self.music_volume * 0.5)
            s.play(maxtime=180)

    def _synth_level_clear(self):
        sequence = [523.25, 659.25, 783.99, 1046.5]
        for i, freq in enumerate(sequence):
            tone = self._tone(freq, 0.14 + i * 0.015, "triangle")
            tone.set_volume(self.sfx_volume * 0.9)
            tone.play(maxtime=220)

    def play_level_clear(self):
        if not self.sfx_enabled:
            return
        snd = self.sfx_cache.get("sfx_level_clear")
        if snd is not None:
            snd.set_volume(self.sfx_volume)
            snd.play()
        else:
            self._synth_level_clear()

    def play_music(self, name: str):
        self.current_music = name
        if not self.music_enabled:
            return
        pygame.mixer.music.stop()
        p = self.music_paths.get(name)
        if p:
            try:
                pygame.mixer.music.load(str(p))
                pygame.mixer.music.set_volume(self.music_volume)
                pygame.mixer.music.play(-1)
                return
            except pygame.error:
                pass
        self._synth_music(name)

    def stop_music(self):
        pygame.mixer.music.stop()

    def play_sfx(self, name: str):
        if not self.sfx_enabled:
            return
        snd = self.sfx_cache.get(name)
        if snd is None:
            snd = self._synth_sfx(name)
            self.sfx_cache[name] = snd
        snd.set_volume(self.sfx_volume)
        snd.play()

    def toggle_music(self):
        self.music_enabled = not self.music_enabled
        if not self.music_enabled:
            self.stop_music()
        elif self.current_music:
            self.play_music(self.current_music)

    def toggle_sfx(self):
        self.sfx_enabled = not self.sfx_enabled

    def adjust_music(self, d: float):
        self.music_volume = max(0.0, min(1.0, self.music_volume + d))
        pygame.mixer.music.set_volume(self.music_volume)

    def adjust_sfx(self, d: float):
        self.sfx_volume = max(0.0, min(1.0, self.sfx_volume + d))


class Shot:
    def __init__(self, tx, ty, direction):
        self.x = tx + 0.5
        self.y = ty + 0.5
        self.direction = direction
        self.speed = 12.0
        self.active = True

    def tile(self):
        return int(self.x), int(self.y)

    def update(self, dt, game):
        self.x += self.direction[0] * self.speed * dt
        self.y += self.direction[1] * self.speed * dt
        tx, ty = self.tile()

        if not game.in_bounds(tx, ty) or game.tilemap[ty][tx] == 0:
            self.active = False
            return

        for m in game.monsters:
            if m.alive and m.tile() == (tx, ty):
                m.alive = False
                self.active = False
                game.monster_killed(by_bonus=False)
                break

    def draw(self, surf):
        px = GRID_X + self.x * TILE_SIZE
        py = GRID_Y + self.y * TILE_SIZE
        pygame.draw.circle(surf, (255, 230, 90), (int(px), int(py)), 4)
        pygame.draw.circle(surf, (255, 170, 40), (int(px), int(py)), 2)


class Bag:
    REST = "rest"
    WOBBLE = "wobble"
    FALL = "fall"
    GOLD = "gold"

    def __init__(self, tx, ty):
        self.tx = tx
        self.ty = ty
        self.state = Bag.REST
        self.timer = 0.0
        self.offset_y = 0.0
        self.fall_tiles = 0

    def tile(self):
        return self.tx, self.ty

    def solid(self):
        return self.state in (Bag.REST, Bag.WOBBLE)

    def update(self, dt, game):
        if self.state == Bag.GOLD:
            return

        support = game.has_support(self.tx, self.ty + 1)
        if self.state == Bag.REST and not support:
            self.state = Bag.WOBBLE
            self.timer = 0.6
            game.audio.play_sfx("sfx_gold_wobble")
        elif self.state == Bag.WOBBLE:
            if support:
                self.state = Bag.REST
            else:
                self.timer -= dt
                if self.timer <= 0:
                    self.state = Bag.FALL
                    self.offset_y = 0.0
                    self.fall_tiles = 0
                    game.audio.play_sfx("sfx_gold_drop")
        elif self.state == Bag.FALL:
            self.offset_y += 8.6 * dt
            while self.offset_y >= 1.0:
                self.offset_y -= 1.0
                self.ty += 1
                self.fall_tiles += 1
                game.crush_at(self.tx, self.ty)

                if not game.in_bounds(self.tx, self.ty + 1) or game.has_support(self.tx, self.ty + 1):
                    self.state = Bag.GOLD if self.fall_tiles >= 2 else Bag.REST
                    self.offset_y = 0.0
                    self.fall_tiles = 0
                    break

    def draw(self, surf):
        px = GRID_X + self.tx * TILE_SIZE
        py = GRID_Y + (self.ty + self.offset_y) * TILE_SIZE

        if self.state == Bag.GOLD:
            col1, col2 = (245, 195, 55), (180, 120, 30)
        elif self.state == Bag.WOBBLE:
            col1, col2 = (200, 145, 70), (125, 85, 40)
        else:
            col1, col2 = (178, 125, 58), (110, 74, 30)

        rect = pygame.Rect(px + 4, py + 5, TILE_SIZE - 8, TILE_SIZE - 10)
        pygame.draw.rect(surf, col1, rect, border_radius=6)
        pygame.draw.rect(surf, col2, rect, 2, border_radius=6)
        pygame.draw.line(surf, col2, (rect.left + 3, rect.top + 7), (rect.right - 3, rect.top + 7), 1)


class Monster:
    def __init__(self, tx, ty, mtype="nobbin", speed=2.8):
        self.x = float(tx)
        self.y = float(ty)
        self.target = (tx, ty)
        self.type = mtype
        self.speed = speed
        self.alive = True
        self.transform_timer = random.uniform(8.0, 14.0)

    def tile(self):
        return int(self.x + 0.5), int(self.y + 0.5)

    def update(self, dt, game):
        if not self.alive:
            return

        self.transform_timer -= dt
        if self.type == "nobbin" and self.transform_timer <= 0:
            self.type = "hobbin"

        dx = self.target[0] - self.x
        dy = self.target[1] - self.y
        dist = math.hypot(dx, dy)

        if dist < 0.02:
            self.x, self.y = float(self.target[0]), float(self.target[1])
            self.target = self.choose_target(game)
        else:
            step = min(dist, self.speed * dt)
            self.x += dx / dist * step
            self.y += dy / dist * step

        tx, ty = self.tile()
        if self.type == "hobbin" and game.in_bounds(tx, ty) and game.tilemap[ty][tx] == 0:
            game.tilemap[ty][tx] = 1

        if (tx, ty) == game.player_tile():
            if game.bonus_mode:
                self.alive = False
                game.monster_killed(by_bonus=True)
            else:
                game.kill_player()

    def choose_target(self, game):
        cur = self.tile()
        nbs = game.valid_neighbors(*cur, self.type)
        if not nbs:
            return cur

        if game.bonus_mode:
            return max(nbs, key=lambda p: game.manhattan(p, game.player_tile()))

        nxt = game.bfs_next(cur, game.player_tile(), self.type)
        return nxt if nxt else random.choice(nbs)

    def draw(self, surf):
        px = GRID_X + self.x * TILE_SIZE + TILE_SIZE // 2
        py = GRID_Y + self.y * TILE_SIZE + TILE_SIZE // 2

        if self.type == "nobbin":
            main, shade, glow = (228, 72, 72), (140, 35, 35), (255, 145, 145)
        else:
            main, shade, glow = (150, 80, 226), (85, 45, 130), (210, 170, 255)

        body = [(px - 10, py + 8), (px - 10, py - 2), (px - 6, py - 8), (px + 6, py - 8), (px + 10, py - 2), (px + 10, py + 8)]
        pygame.draw.polygon(surf, (20, 16, 24), body)
        pygame.draw.polygon(surf, main, body)
        pygame.draw.polygon(surf, shade, body, 2)

        for wave in (-7, -2, 3, 8):
            pygame.draw.circle(surf, main, (int(px + wave), int(py + 9)), 3)
            pygame.draw.circle(surf, shade, (int(px + wave), int(py + 9)), 1)

        pygame.draw.circle(surf, (245, 245, 255), (int(px - 4), int(py - 2)), 3)
        pygame.draw.circle(surf, (245, 245, 255), (int(px + 4), int(py - 2)), 3)
        pygame.draw.circle(surf, glow, (int(px - 2), int(py - 2)), 1)
        pygame.draw.circle(surf, glow, (int(px + 2), int(py - 2)), 1)
        pygame.draw.circle(surf, (15, 15, 20), (int(px - 4), int(py - 1)), 1)
        pygame.draw.circle(surf, (15, 15, 20), (int(px + 4), int(py - 1)), 1)


class Game:
    def __init__(self, screen):
        self.screen = screen
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("consolas", 22)
        self.small = pygame.font.SysFont("consolas", 16)
        self.audio = AudioManager()

        self.state = "MENU"
        self.score = 0
        self.lives = 3
        self.level = 1
        self.next_extra = 20000

        self.last_turn_input = (1, 0)
        self.pause_option = 0
        self.level_clear_timer = 0.0

        self.new_level()
        self.audio.play_music("music_title")

    def new_level(self):
        self.tilemap = [[0 for _ in range(GRID_W)] for _ in range(GRID_H)]
        for y in range(1, GRID_H - 1):
            self.tilemap[y][1] = 1
        for x in range(1, GRID_W - 1):
            self.tilemap[GRID_H - 2][x] = 1

        self.player_x = 1.0
        self.player_y = 1.0
        self.player_target = (1, 1)
        self.player_dir = (1, 0)
        self.player_speed = 6.3

        self.wanted_dir = None
        self.shot_cd = 0.0
        self.shot_delay = max(0.18, 0.33 + (self.level - 1) * 0.04)

        self.emeralds = set()
        self.bags = []
        self.shots = []
        self.monsters = []

        self.spawn_tile = (GRID_W - 2, 1)
        self.total_monsters = min(12, 4 + self.level)
        self.spawned = 0
        self.spawn_timer = 0.9

        self.cherry_pos = None
        self.cherry_active = False

        self.bonus_mode = False
        self.bonus_timer = 0.0
        self.bonus_chain = 0

        self.emerald_streak = 0

        self._populate_level()

    def _populate_level(self):
        safe = {(1, 1), (1, 2), (2, 1), self.spawn_tile}
        for y in range(2, GRID_H - 2):
            for x in range(2, GRID_W - 2):
                r = random.random()
                if r < 0.12 and (x, y) not in safe:
                    self.emeralds.add((x, y))
                elif r < 0.17 and (x, y) not in safe:
                    self.bags.append(Bag(x, y))

        while len(self.emeralds) < 22:
            x = random.randint(2, GRID_W - 3)
            y = random.randint(2, GRID_H - 3)
            if (x, y) not in safe:
                self.emeralds.add((x, y))

    def in_bounds(self, x, y):
        return 0 <= x < GRID_W and 0 <= y < GRID_H

    def player_tile(self):
        return int(self.player_x + 0.5), int(self.player_y + 0.5)

    def bag_at(self, x, y):
        for b in self.bags:
            if b.tile() == (x, y):
                return b
        return None

    def has_support(self, x, y):
        if not self.in_bounds(x, y):
            return True
        b = self.bag_at(x, y)
        if b and b.state != Bag.FALL:
            return True
        return self.tilemap[y][x] == 0

    def valid_neighbors(self, x, y, mtype):
        out = []
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not self.in_bounds(nx, ny):
                continue
            b = self.bag_at(nx, ny)
            if b and b.solid():
                continue
            if mtype == "nobbin":
                if self.tilemap[ny][nx] == 1:
                    out.append((nx, ny))
            else:
                out.append((nx, ny))
        return out

    def bfs_next(self, start, goal, mtype):
        q = deque([start])
        prev = {start: None}
        while q:
            n = q.popleft()
            if n == goal:
                break
            for nb in self.valid_neighbors(*n, mtype):
                if nb not in prev:
                    prev[nb] = n
                    q.append(nb)
        if goal not in prev:
            return None
        cur = goal
        while prev[cur] and prev[cur] != start:
            cur = prev[cur]
        return cur

    def manhattan(self, a, b):
        return abs(a[0] - b[0]) + abs(a[1] - b[1])

    def crush_at(self, x, y):
        if self.player_tile() == (x, y):
            self.kill_player()
        for m in self.monsters:
            if m.alive and m.tile() == (x, y):
                m.alive = False
                self.monster_killed(by_bonus=False)

    def monster_killed(self, by_bonus=False):
        if by_bonus:
            pts = 200 * (2 ** self.bonus_chain)
            self.bonus_chain = min(6, self.bonus_chain + 1)
            self.score += pts
        else:
            self.score += 250
        self.audio.play_sfx("sfx_monster_die")

    def kill_player(self):
        if self.state != "PLAYING":
            return
        self.audio.play_sfx("sfx_player_die")
        self.lives -= 1
        if self.lives <= 0:
            self.state = "GAME_OVER"
            self.audio.stop_music()
            return

        self.player_x = 1.0
        self.player_y = 1.0
        self.player_target = (1, 1)
        self.player_dir = (1, 0)

    def poll_keyboard_direction(self):
        keys = pygame.key.get_pressed()
        priority = [pygame.K_UP, pygame.K_DOWN, pygame.K_LEFT, pygame.K_RIGHT]
        for k in priority:
            if keys[k]:
                self.wanted_dir = DIR_KEYS[k]
                self.last_turn_input = self.wanted_dir
                return
        self.wanted_dir = None

    def can_move_player(self, nx, ny, dx, dy):
        if not self.in_bounds(nx, ny):
            return False

        b = self.bag_at(nx, ny)
        if b is None:
            return True

        # bag push: only horizontal, one tile, if bag at rest and target tile tunnel/free
        if b.state != Bag.REST or dy != 0:
            return False

        px, py = nx + dx, ny
        if not self.in_bounds(px, py):
            return False
        if self.bag_at(px, py):
            return False
        if self.tilemap[py][px] == 0:
            return False

        b.tx, b.ty = px, py
        return True

    def collect(self):
        pt = self.player_tile()
        if pt in self.emeralds:
            self.emeralds.remove(pt)
            self.score += 25
            self.emerald_streak += 1
            self.audio.play_sfx("sfx_emerald")
            if self.emerald_streak >= 8:
                self.score += 250
                self.emerald_streak = 0

        b = self.bag_at(*pt)
        if b and b.state == Bag.GOLD:
            self.score += 500
            self.audio.play_sfx("sfx_gold_collect")
            self.bags.remove(b)

        if self.cherry_active and pt == self.cherry_pos:
            self.cherry_active = False
            self.cherry_pos = None
            self.bonus_mode = True
            self.bonus_chain = 0
            self.bonus_timer = max(7.0, 14.0 - self.level * 0.55)
            self.audio.play_sfx("sfx_bonus_start")

        if self.score >= self.next_extra:
            self.next_extra += 20000
            self.lives += 1

    def update_player(self, dt):
        dx = self.player_target[0] - self.player_x
        dy = self.player_target[1] - self.player_y
        dist = math.hypot(dx, dy)

        if dist < 0.02:
            self.player_x, self.player_y = float(self.player_target[0]), float(self.player_target[1])
            cx, cy = self.player_tile()

            if self.wanted_dir:
                tx, ty = cx + self.wanted_dir[0], cy + self.wanted_dir[1]
                if self.can_move_player(tx, ty, *self.wanted_dir):
                    self.player_dir = self.wanted_dir

            nx, ny = cx + self.player_dir[0], cy + self.player_dir[1]
            if self.can_move_player(nx, ny, *self.player_dir):
                self.player_target = (nx, ny)
            else:
                # if blocked, try remembered direction to avoid sticky controls
                if self.wanted_dir and self.wanted_dir != self.player_dir:
                    nx2, ny2 = cx + self.wanted_dir[0], cy + self.wanted_dir[1]
                    if self.can_move_player(nx2, ny2, *self.wanted_dir):
                        self.player_dir = self.wanted_dir
                        self.player_target = (nx2, ny2)
                    else:
                        self.player_target = (cx, cy)
                else:
                    self.player_target = (cx, cy)

        else:
            step = min(dist, self.player_speed * dt)
            self.player_x += dx / dist * step
            self.player_y += dy / dist * step

        tx, ty = self.player_tile()
        if self.in_bounds(tx, ty) and self.tilemap[ty][tx] == 0:
            self.tilemap[ty][tx] = 1
            self.audio.play_sfx("sfx_dig")

    def spawn_monsters(self, dt):
        if self.spawned >= self.total_monsters:
            if not self.cherry_active and self.cherry_pos is None:
                self.cherry_pos = (GRID_W // 2, GRID_H // 2)
                self.cherry_active = True
            return

        self.spawn_timer -= dt
        if self.spawn_timer <= 0:
            speed = min(5.8, 2.2 + self.level * 0.32)
            self.monsters.append(Monster(*self.spawn_tile, "nobbin", speed))
            self.spawned += 1
            self.spawn_timer = max(0.85, 2.4 - self.level * 0.16)

    def shoot(self):
        if self.state != "PLAYING" or self.shot_cd > 0:
            return
        tx, ty = self.player_tile()
        self.shots.append(Shot(tx, ty, self.player_dir))
        self.shot_cd = self.shot_delay
        self.audio.play_sfx("sfx_shoot")

    def update(self, dt):
        if self.state != "PLAYING":
            return

        self.poll_keyboard_direction()
        self.shot_cd = max(0.0, self.shot_cd - dt)

        self.update_player(dt)
        self.collect()

        for b in list(self.bags):
            b.update(dt, self)

        self.spawn_monsters(dt)

        for m in self.monsters:
            m.update(dt, self)
        self.monsters = [m for m in self.monsters if m.alive]

        for s in self.shots:
            s.update(dt, self)
        self.shots = [s for s in self.shots if s.active]

        if self.bonus_mode:
            self.bonus_timer -= dt
            if self.bonus_timer <= 0:
                self.bonus_mode = False
                self.bonus_timer = 0.0
                self.audio.play_sfx("sfx_bonus_end")

        if not self.emeralds:
            self.level_clear_timer += dt
            if self.level_clear_timer > 1.2:
                self.audio.play_level_clear()
                self.level += 1
                self.level_clear_timer = 0.0
                self.new_level()
        else:
            self.level_clear_timer = 0.0

    def handle_keydown(self, key):
        if key in DIR_KEYS:
            self.wanted_dir = DIR_KEYS[key]
            self.last_turn_input = self.wanted_dir

        if key in (pygame.K_SPACE, pygame.K_LCTRL, pygame.K_RCTRL):
            self.shoot()

        if key == pygame.K_m:
            self.audio.toggle_music()
        elif key == pygame.K_n:
            self.audio.toggle_sfx()
        elif key == pygame.K_COMMA:
            self.audio.adjust_music(-0.1)
        elif key == pygame.K_PERIOD:
            self.audio.adjust_music(0.1)
        elif key == pygame.K_k:
            self.audio.adjust_sfx(-0.1)
        elif key == pygame.K_l:
            self.audio.adjust_sfx(0.1)

        if self.state == "MENU" and key == pygame.K_RETURN:
            self.state = "PLAYING"
            self.audio.play_music("music_game")

        elif self.state == "PLAYING" and key == pygame.K_ESCAPE:
            self.state = "PAUSED"
            self.pause_option = 0

        elif self.state == "PAUSED":
            if key in (pygame.K_UP, pygame.K_DOWN):
                self.pause_option = 1 - self.pause_option
            elif key == pygame.K_RETURN:
                if self.pause_option == 0:
                    self.state = "PLAYING"
                else:
                    pygame.event.post(pygame.event.Event(pygame.QUIT))
            elif key == pygame.K_ESCAPE:
                self.state = "PLAYING"

        elif self.state == "GAME_OVER" and key == pygame.K_r:
            self.score = 0
            self.lives = 3
            self.level = 1
            self.next_extra = 20000
            self.state = "PLAYING"
            self.new_level()
            self.audio.play_music("music_game")

    def draw_tile(self, x, y):
        px = GRID_X + x * TILE_SIZE
        py = GRID_Y + y * TILE_SIZE
        rect = pygame.Rect(px, py, TILE_SIZE, TILE_SIZE)

        if self.tilemap[y][x] == 0:  # earth
            pygame.draw.rect(self.screen, (83, 48, 28), rect)
            pygame.draw.rect(self.screen, (67, 36, 20), rect, 1)
            # retro dirt pattern
            for oy in (6, 15, 24):
                for ox in (5, 13, 22):
                    c = (102, 65, 40) if (ox + oy) % 2 else (56, 30, 18)
                    self.screen.fill(c, (px + ox, py + oy, 2, 2))
        else:  # tunnel
            pygame.draw.rect(self.screen, (34, 34, 38), rect)
            pygame.draw.rect(self.screen, (20, 20, 24), rect, 1)
            self.screen.fill((46, 46, 52), (px + 3, py + 3, TILE_SIZE - 6, 1))

    def draw_world(self):
        for y in range(GRID_H):
            for x in range(GRID_W):
                self.draw_tile(x, y)

        for ex, ey in self.emeralds:
            px = GRID_X + ex * TILE_SIZE + TILE_SIZE // 2
            py = GRID_Y + ey * TILE_SIZE + TILE_SIZE // 2
            pts = [(px, py - 9), (px + 8, py), (px, py + 9), (px - 8, py)]
            pygame.draw.polygon(self.screen, (20, 235, 190), pts)
            pygame.draw.polygon(self.screen, (10, 100, 80), pts, 1)

        if self.cherry_active and self.cherry_pos:
            cx = GRID_X + self.cherry_pos[0] * TILE_SIZE + TILE_SIZE // 2
            cy = GRID_Y + self.cherry_pos[1] * TILE_SIZE + TILE_SIZE // 2
            pygame.draw.circle(self.screen, (220, 50, 70), (cx - 4, cy), 7)
            pygame.draw.circle(self.screen, (220, 50, 70), (cx + 4, cy), 7)
            pygame.draw.circle(self.screen, (255, 120, 150), (cx - 6, cy - 2), 2)
            pygame.draw.circle(self.screen, (255, 120, 150), (cx + 2, cy - 2), 2)
            pygame.draw.line(self.screen, (30, 180, 80), (cx, cy - 8), (cx + 7, cy - 14), 2)

        for b in self.bags:
            b.draw(self.screen)
        for m in self.monsters:
            m.draw(self.screen)
        for s in self.shots:
            s.draw(self.screen)

        self.draw_player()

    def draw_player(self):
        px = GRID_X + self.player_x * TILE_SIZE + TILE_SIZE // 2
        py = GRID_Y + self.player_y * TILE_SIZE + TILE_SIZE // 2

        if self.bonus_mode:
            blink_on = (pygame.time.get_ticks() // 120) % 2 == 0
            body = (255, 255, 255) if blink_on else (255, 255, 155)
            border = (220, 220, 220) if blink_on else (145, 115, 30)
        else:
            body = (255, 245, 120)
            border = (145, 115, 30)
        pygame.draw.circle(self.screen, border, (int(px), int(py)), 12)
        pygame.draw.circle(self.screen, body, (int(px), int(py)), 10)

        dx, dy = self.player_dir
        nose_x = px + dx * 10
        nose_y = py + dy * 10
        pygame.draw.circle(self.screen, (255, 180, 50), (int(nose_x), int(nose_y)), 4)

        eye_x = px + (3 if dx >= 0 else -3)
        eye_y = py - 3
        pygame.draw.circle(self.screen, (20, 20, 20), (int(eye_x), int(eye_y)), 2)

    def draw_hud(self):
        top = f"SCORE {self.score:06d}   LIVES {self.lives}   LEVEL {self.level}"
        self.screen.blit(self.font.render(top, True, (246, 232, 182)), (24, 20))

        bonus = f"BONUS: {self.bonus_timer:04.1f}s" if self.bonus_mode else "BONUS: off"
        self.screen.blit(self.small.render(bonus, True, (255, 184, 88)), (24, 54))

        aud = (
            f"Music: {'on' if self.audio.music_enabled else 'off'} {self.audio.music_volume:.1f}"
            f" | SFX: {'on' if self.audio.sfx_enabled else 'off'} {self.audio.sfx_volume:.1f}"
        )
        self.screen.blit(self.small.render(aud, True, (165, 210, 255)), (410, 54))

        controls = "Arrows bewegen | SPACE/CTRL schießen | ESC Pause | M/N Toggle | ,/. K/L Volume"
        self.screen.blit(self.small.render(controls, True, (155, 155, 165)), (24, SCREEN_HEIGHT - 24))

    def draw_overlay(self):
        if self.state == "MENU":
            t = self.font.render("RETRO DIGGER TRIBUTE", True, (255, 220, 130))
            s = self.small.render("ENTER: Start", True, (240, 240, 240))
            self.screen.blit(t, (SCREEN_WIDTH // 2 - t.get_width() // 2, 274))
            self.screen.blit(s, (SCREEN_WIDTH // 2 - s.get_width() // 2, 310))

        elif self.state == "PAUSED":
            sh = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            sh.fill((0, 0, 0, 155))
            self.screen.blit(sh, (0, 0))
            title = self.font.render("PAUSED", True, (255, 255, 255))
            self.screen.blit(title, (SCREEN_WIDTH // 2 - title.get_width() // 2, 240))
            opts = ["Resume", "Quit"]
            for i, txt in enumerate(opts):
                c = (255, 220, 110) if i == self.pause_option else (190, 190, 190)
                r = self.small.render(txt, True, c)
                self.screen.blit(r, (SCREEN_WIDTH // 2 - r.get_width() // 2, 290 + i * 28))

        elif self.state == "GAME_OVER":
            t = self.font.render("GAME OVER", True, (255, 100, 100))
            s = self.small.render("R: Restart", True, (250, 250, 250))
            self.screen.blit(t, (SCREEN_WIDTH // 2 - t.get_width() // 2, 264))
            self.screen.blit(s, (SCREEN_WIDTH // 2 - s.get_width() // 2, 300))

    def draw(self):
        self.screen.fill((10, 10, 14))
        self.draw_world()
        self.draw_hud()
        self.draw_overlay()

    def run(self):
        running = True
        while running:
            dt = self.clock.tick(FPS) / 1000.0
            for ev in pygame.event.get():
                if ev.type == pygame.QUIT:
                    running = False
                elif ev.type == pygame.KEYDOWN:
                    self.handle_keydown(ev.key)

            self.update(dt)
            self.draw()
            pygame.display.flip()

        pygame.quit()


def main():
    pygame.mixer.pre_init(44100, -16, 1, 512)
    pygame.init()
    pygame.display.set_caption("Retro Digger Tribute")
    screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
    Game(screen).run()


if __name__ == "__main__":
    main()
