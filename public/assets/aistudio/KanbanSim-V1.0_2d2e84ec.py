import tkinter as tk
import random
import time

def get_card_color(card_number):
    # Erzeugt  festen Farbton 
    return "#7b8388"

# --------------------- Model ---------------------
class Card:
    def __init__(self, card_id, birth_id, col, x, y, is_red=False):
        self.card_id = card_id      # Interne ID (nicht Canvas-ID)
        self.birth_id = birth_id    # Anzeige-/Sortier-ID
        self.col = col              # Aktuelle Spalte
        self.x = x                  # Logische x-Position
        self.y = y                  # Logische y-Position
        self.target_col = None      # Zielspalte, wenn in Bewegung
        self.target_x = None        # Ziel-x-Position
        self.moving = False         # Flag, ob die Karte animiert wird
        self.days_on_board = 0
        self.start_day = 0
        self.finish_day = None
        self.cycle_time = None
        self.is_red = is_red
        self.processing_time = 0
        # Neue Attribute für die Flusseffizienz:
        self.BZ = 0   # Bearbeitungszeit in aktiven Spalten
        self.WZ = 0   # Wartezeit in Warte-Spalten

class KanbanModel:
    def __init__(self):
        # Simulations- und Anzeigeparameter
        self.cards = []
        self.next_card_id = 12
        self.day_count = 0
        self.previous_run_avg = None
        self.wip_limit = 12
        self.column_names = [
            "Backlog", "Schritt A", "Warten...", "Schritt B",
            "Warten...", "Schritt C", "Warten...", "Done"
        ]
        self.column_x_positions = [50, 200, 350, 500, 650, 800, 950, 1100]
        self.complexity_columns = [1, 3, 5]
        self.working_columns = [1, 3, 5]
        self.graph_counter = 0
        self.current_color = "#7b8388"
        self.red_card_generated = False
        self.sim_start_time = None
        self.round_counter = 0
        # Hier wird die maximale Anzahl von Karten pro Spalte geführt:
        self.column_max_count = [0] * len(self.column_names)

    def reset(self):
        self.cards.clear()
        self.day_count = 0
        self.previous_run_avg = None
        self.next_card_id = 12
        self.red_card_generated = False
        self.column_max_count = [0] * len(self.column_names)

    def add_card(self, x_pos, y_pos):
        card_id = self.next_card_id
        self.next_card_id += 1
        color = get_card_color(card_id)
        card = Card(card_id, card_id, 0, x_pos, y_pos)
        return card, color

    def get_group_columns(self, col):
        if col == 1:
            return [1, 2]
        elif col == 3:
            return [3, 4]
        elif col == 5:
            return [5, 6]
        return []

    def is_group_full(self, group_columns):
        count = sum(1 for c in self.cards if c.col in group_columns and not c.moving)
        return count >= self.wip_limit

# --------------------- View ---------------------
class KanbanView(tk.Tk):
    def __init__(self, model):
        super().__init__()
        self.model = model
        self.title("Kanban Simulation")
        self.geometry("1200x700")
        self.configure(bg="white")
        self.resizable(False, False)
        # Schriftarten
        self.font_default = ("Myriad Pro", 11)
        self.font_header = ("Myriad Pro", 11, "bold")
        self.font_label = ("Myriad Pro", 11)
        self.font_table = ("Myriad Pro", 14)
        self.create_widgets()

    def create_widgets(self):
        # --- Top Frame: Bedienkonsole ---
        self.top_frame = tk.Frame(self, bg="white", relief="groove", bd=2)
        self.top_frame.pack(side=tk.TOP, fill=tk.X, pady=5, padx=5)
        tk.Label(self.top_frame, text="WiP-Limit:", font=self.font_header, bg="white").pack(side=tk.LEFT, padx=5)
        self.wip_entry_var = tk.StringVar(value="10")
        self.wip_entry = tk.Entry(self.top_frame, textvariable=self.wip_entry_var, width=5, font=self.font_table)
        self.wip_entry.pack(side=tk.LEFT, padx=5)
        tk.Label(self.top_frame, text="Animation Speed:", font=self.font_header, bg="white").pack(side=tk.LEFT, padx=10)
        self.anim_speed = tk.IntVar(value=8)
        self.speed_slider = tk.Scale(self.top_frame, variable=self.anim_speed, from_=1, to=20,
                                     orient=tk.HORIZONTAL, font=self.font_default)
        self.speed_slider.pack(side=tk.LEFT, padx=5)
        self.clear_button = tk.Button(self.top_frame, text="Tabelle löschen", font=self.font_default,
                                      bg="#7b8388", fg="black")
        self.clear_button.pack(side=tk.LEFT, padx=10)
        self.pause_button = tk.Button(self.top_frame, text="Pause", font=self.font_default,
                                      bg="#7b8388", fg="black")
        self.pause_button.pack(side=tk.LEFT, padx=10)
        self.restart_button = tk.Button(self.top_frame, text="Neustart", font=self.font_header,
                                        bg="#7b8388", fg="black")
        self.restart_button.pack(side=tk.LEFT, padx=10)
        logo_label = tk.Label(self.top_frame, text="it-agile GmbH 2025", font=("Arial", 12, "bold"), bg="white")
        logo_label.pack(side=tk.RIGHT, padx=20)


        
        # --- Canvas für das Board ---
        self.canvas_width = 1200
        self.canvas_height = 500
        self.canvas = tk.Canvas(self, bg="white", width=self.canvas_width, height=self.canvas_height)
        self.canvas.pack(side=tk.TOP, fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.header_text_ids = [None] * len(self.model.column_names)
        self.draw_column_backgrounds()
        self.draw_column_boundaries()
        self.draw_column_headers()
        self.complexity_entries = {}
        self.complexity_window_ids = {}
        self.place_complexity_entries(default_value="1")
        
        # --- Bottom Frame: Dashboard /Tabelle ---
        self.bottom_frame = tk.Frame(self, bg="white", relief="groove", bd=2)
        self.bottom_frame.pack(side=tk.BOTTOM, fill=tk.BOTH, padx=5, pady=5)
        header_frame = tk.Frame(self.bottom_frame, bg="white")
        header_frame.pack(fill=tk.X)
        headers = [("Runde", 10), ("WiP Limit", 10), ("Durchlaufzeit rote Karte", 10),
                   ("Flusseffizienz", 12), ("in Progress", 12), ("Done", 10), ("Durchsatz", 12)]
        self.table_headers = headers
        for i, (text, col_width) in enumerate(headers):
            lbl = tk.Label(header_frame, text=text, font=self.font_header, bg="white",
                           borderwidth=1, relief="solid", padx=5, pady=2, width=col_width)
            lbl.grid(row=0, column=i, sticky="nsew", padx=1, pady=1, ipadx=15)
            header_frame.grid_columnconfigure(i, weight=1)
        self.table_frame = tk.Frame(self.bottom_frame, bg="white")
        self.table_frame.pack(fill=tk.X)
        for i in range(len(self.table_headers)):
            self.table_frame.grid_columnconfigure(i, weight=1)
        self.table_row = 1

        # --- Graph Fenster (als Toplevel) ---
        self.create_graph_window()

    def draw_column_backgrounds(self):
        bg_colors = {0: "#E1E1E1", 1: "white", 2: "#E1E1E1", 3: "white",
                     4: "#E1E1E1", 5: "white", 6: "#E1E1E1", 7: "white"}
        for col in range(len(self.model.column_names)):
            color = bg_colors.get(col, "white")
            xc = self.model.column_x_positions[col]
            xl = xc - 75
            xr = xc + 75
            self.canvas.create_rectangle(xl, 0, xr, self.canvas_height + 100,
                                         fill=color, outline="", tags="bg_rect")
    
    def draw_column_boundaries(self):
        for i in range(1, len(self.model.column_x_positions)):
            x_left = self.model.column_x_positions[i - 1]
            x_right = self.model.column_x_positions[i]
            mid_x = (x_left + x_right) // 2
            self.canvas.create_line(mid_x, 0, mid_x, self.canvas_height,
                                    width=2, fill="gray", tags="bg_line")
    
    def draw_column_headers(self):
        for i, name in enumerate(self.model.column_names):
            x_pos = self.model.column_x_positions[i]
            text = self.get_column_header_text(i)
            tid = self.canvas.create_text(x_pos, 50, text=text,
                                          font=self.font_header, fill="black", anchor="center")
            self.header_text_ids[i] = tid

    def get_column_header_text(self, col):
        # Für Wartespalten (2,4,6) wird der maximale Wert angezeigt.
        if col in [2, 4, 6]:
            return f"{self.model.column_names[col]} (WiP max = {self.model.column_max_count[col]})"
        else:
            return self.model.column_names[col]

    
    def place_complexity_entries(self, default_value="1"):
        for col in self.model.complexity_columns:
            x_pos = self.model.column_x_positions[col]
            frame = tk.Frame(self.canvas, bg="white")
            label = tk.Label(frame, text="Complexity:", font=self.font_default, bg="white")
            label.pack(side=tk.LEFT)
            entry = tk.Entry(frame, width=5, font=self.font_label)
            defaults = {1: "1", 3: "2", 5: "5"}
            entry.insert(0, defaults.get(col, default_value))
            entry.pack(side=tk.LEFT)
            self.complexity_entries[col] = entry
            win_id = self.canvas.create_window(x_pos, 15, window=frame, anchor="center")
            self.complexity_window_ids[col] = win_id

    def add_table_row(self, row_data):
        for i, value in enumerate(row_data):
            lbl = tk.Label(self.table_frame, text=str(value), font=self.font_table, bg="white",
                           borderwidth=1, relief="solid", padx=5, pady=2, width=self.table_headers[i][1])
            lbl.grid(row=self.table_row, column=i, sticky="nsew", padx=1, pady=1)
        self.table_row += 1

    def clear_table(self):
        for widget in self.table_frame.winfo_children():
            widget.destroy()
        self.table_row = 1

    def create_graph_window(self):
        self.graph_window = tk.Toplevel(self)
        self.graph_window.title("Cost of Delay")
        self.graph_canvas = tk.Canvas(self.graph_window, width=600, height=400, bg="white")
        self.graph_canvas.pack()
        self.graph_margin = 60
        self.graph_max_day = 100
        self.graph_max_y = 500
        # Zeichne die Achsen:
        self.graph_canvas.create_line(self.graph_margin, 10, self.graph_margin, 400 - self.graph_margin, fill="black")
        self.graph_canvas.create_line(self.graph_margin, 400 - self.graph_margin, 600 - self.graph_margin, 400 - self.graph_margin, fill="black")
        # Achsenbeschriftungen für X und Y:
        self.graph_canvas.create_text(300, 410, text="Runde", font=("Arial", 10))
        self.graph_canvas.create_text(20, 200, text="Cost \nof Delay", font=("Arial", 10))
        self.last_graph_point = None
        self.update_graph()

    def update_graph(self):
        if self.model.round_counter > 0:
            cumulative_revenue = 0
            for card in self.model.cards:
                if card.col == 7 and card.finish_day is not None:
                    cumulative_revenue += (self.model.day_count - card.finish_day)
            bar_width = 40
            gap = 20
            # Erste Runde (Runde 1) beginnt bei x = graph_margin:
            x = self.graph_margin + (self.model.round_counter - 1) * (bar_width + gap)
            scale = 5
            y1 = 400 - self.graph_margin
            red_cycle = 0
            for card in self.model.cards:
                if card.is_red and card.cycle_time is not None:
                    red_cycle = card.cycle_time
                    break
            y0 = y1 - (red_cycle * scale)
            self.graph_canvas.create_rectangle(x, y0, x + bar_width, y1, fill=self.model.current_color, outline="black")
            # Beschriftung oberhalb des Balkens:
            self.graph_canvas.create_text(x + bar_width/2, y0 - 10, text=str(self.model.round_counter),
                                          font=self.font_default, fill="black")
        self.graph_window.after(2000, self.update_graph)

    # --- Methoden für die Kartenanzeige ---
    def draw_card(self, card, color):
        x_pos = self.model.column_x_positions[card.col]
        # Für Backlog: Alle Karten in Spalte 0 (egal ob moving oder nicht) berücksichtigen,
        # damit die Reihenfolge konsistent ist
        if card.col == 0:
            cards_in_col = [c for c in self.model.cards if c.col == 0]
        else:
            cards_in_col = [c for c in self.model.cards if c.col == card.col and not c.moving]
        y_pos = 100 + len(cards_in_col) * 35
        shadow_offset = 3
        shadow_id = self.canvas.create_rectangle(
            x_pos - 20 + shadow_offset, y_pos - 15 + shadow_offset,
            x_pos + 20 + shadow_offset, y_pos + 15 + shadow_offset,
            fill="#d3d3d3", outline=""
        )
        rid = self.canvas.create_rectangle(
            x_pos - 20, y_pos - 15,
            x_pos + 20, y_pos + 15,
            fill=color, outline="black"
        )
        tid = self.canvas.create_text(
            x_pos, y_pos,
            text=str(card.birth_id), fill="white", font=self.font_default
        )
        return {"rect": rid, "text": tid, "shadow": shadow_id, "x": x_pos, "y": y_pos}

    def move_card(self, card_draw, dx):
        self.canvas.move(card_draw["rect"], dx, 0)
        self.canvas.move(card_draw["text"], dx, 0)
        self.canvas.move(card_draw["shadow"], dx, 0)
        card_draw["x"] += dx

# --------------------- Controller ---------------------
class KanbanController:
    def __init__(self):
        self.model = KanbanModel()
        self.view = KanbanView(self.model)
        self.card_drawings = {}
        self.paused = False
        self.move_cards_id = None
        self.decide_moves_id = None
        self.red_card_after_id = None
        self.red_card_due_time = None
        self.red_card_remaining = None
        self.help_mode = tk.BooleanVar(value=False)
        self.view.clear_button.config(command=self.view.clear_table)
        self.view.restart_button.config(command=self.on_restart)
        self.view.pause_button.config(command=self.toggle_pause)
        # Simulation startet erst nach explizitem Neustart!

    def on_restart(self):
        try:
            val = int(self.view.wip_entry_var.get())
            self.model.wip_limit = max(val, 0)
        except ValueError:
            pass
        self.reset_board()
        self.model.sim_start_time = time.time()
        self.model.red_card_generated = False
        self.model.current_color = self.get_next_color()
        # Rote Karte erst nach 10 Sekunden generieren:
        self.red_card_due_time = time.time() + 10
        self.view.after(10000, self.generate_red_card)
        self.decide_moves_id = self.view.after(250, self.decide_moves)
        self.paused = False
        self.view.pause_button.config(text="Pause")

    def reset_board(self):
        if self.move_cards_id:
            self.view.after_cancel(self.move_cards_id)
        if self.decide_moves_id:
            self.view.after_cancel(self.decide_moves_id)
        for card_draw in self.card_drawings.values():
            self.view.canvas.delete(card_draw["rect"])
            self.view.canvas.delete(card_draw["text"])
            self.view.canvas.delete(card_draw["shadow"])
        self.card_drawings.clear()
        self.model.reset()
        # Erzeuge 12 Backlog-Karten:
        for i in range(12):
            x_pos = self.model.column_x_positions[0]
            y_pos = 100 + i * 35
            color = get_card_color(i + 1)
            card = Card(i, i, 0, x_pos, y_pos)
            self.model.cards.append(card)
            drawing = self.view.draw_card(card, color)
            self.card_drawings[card.birth_id] = drawing
        self.move_cards_id = self.view.after(15, self.move_cards)

    def toggle_pause(self):
        self.view.pause_button.focus_set()
        if not self.paused:
            self.paused = True
            if self.move_cards_id:
                self.view.after_cancel(self.move_cards_id)
                self.move_cards_id = None
            if self.decide_moves_id:
                self.view.after_cancel(self.decide_moves_id)
                self.decide_moves_id = None
            if self.red_card_after_id:
                self.view.after_cancel(self.red_card_after_id)
                self.red_card_after_id = None
                self.red_card_remaining = max(0, self.red_card_due_time - time.time())
            self.view.pause_button.config(text="Weiter")
        else:
            self.paused = False
            self.move_cards_id = self.view.after(15, self.move_cards)
            self.decide_moves_id = self.view.after(250, self.decide_moves)
            if not self.model.red_card_generated and self.red_card_remaining:
                ms_remaining = int(self.red_card_remaining * 1000)
                self.red_card_due_time = time.time() + self.red_card_remaining
                self.red_card_after_id = self.view.after(ms_remaining, self.generate_red_card)
            self.view.pause_button.config(text="Pause")

    def get_next_color(self):
        colors = ["#7b8388", "#e5342d", "#7b8388", "#e5342d",
                  "#7b8388", "#e5342d", "#7b8388", "#e5342d"]
        color = colors[self.model.graph_counter % len(colors)]
        self.model.graph_counter += 1
        return color

    def decide_moves(self):
        # Backlog auffüllen: Hier zählen wir alle Karten in Spalte 0, auch wenn sie sich bewegen.
        backlog_cards = [c for c in self.model.cards if c.col == 0]
        while len(backlog_cards) < 12:
            x_pos = self.model.column_x_positions[0]
            y_pos = 100 + len(backlog_cards) * 35
            card, color = self.model.add_card(x_pos, y_pos)
            self.model.cards.append(card)
            drawing = self.view.draw_card(card, color)
            self.card_drawings[card.birth_id] = drawing
            backlog_cards = [c for c in self.model.cards if c.col == 0]
        
        self.model.day_count += 1
        # Aktualisiere Flusseffizienz für die rote Karte:
        red_card = next((c for c in self.model.cards if c.is_red), None)
        if red_card:
            if red_card.col in [1, 3, 5]:
                red_card.BZ += 1
            elif red_card.col in [2, 4, 6]:
                mapping = {2: 1, 4: 3, 6: 5}
                active_col = mapping.get(red_card.col)
                active_present = any(c for c in self.model.cards if c.col == active_col or (c.target_col == active_col and c.moving))
                if active_present:
                    red_card.WZ += 1

        processed = {}
        for col in self.model.working_columns:
            processed[col] = False
            active_cards = [c for c in self.model.cards if c.col == col or (c.target_col == col and c.moving)]
            if active_cards:
                if self.try_push_card(col):
                    processed[col] = True
            else:
                group = self.model.get_group_columns(col)
                if not self.model.is_group_full(group):
                    prev_col = col - 1
                    prev_cards = [c for c in self.model.cards if c.col == prev_col and not c.moving]
                    if prev_cards:
                        prev_cards.sort(key=lambda x: x.birth_id)
                        self.mark_card_for_move(prev_cards[0], col)
                        processed[col] = True

        # Verschiebe Karte aus Spalte 6 nach 7:
        prev_cards = [c for c in self.model.cards if c.col == 6 and not c.moving]
        if prev_cards:
            prev_cards.sort(key=lambda x: x.birth_id)
            self.mark_card_for_move(prev_cards[0], 7)
        
        red_done = any(c for c in self.model.cards if c.is_red and c.col == 7)
        if red_done:
            self.stop_simulation()
        else:
            self.decide_moves_id = self.view.after(250, self.decide_moves)

    def try_push_card(self, col):
        own_cards = [c for c in self.model.cards if c.col == col and not c.moving]
        if not own_cards:
            return False
        own_cards.sort(key=lambda x: x.birth_id)
        card = own_cards[0]
        try:
            complexity_factor = int(self.view.complexity_entries[col].get())
        except:
            complexity_factor = 1
        if card.processing_time < complexity_factor:
            card.processing_time += 1
            return False
        card.processing_time = 0
        self.mark_card_for_move(card, col + 1)
        return True

    def mark_card_for_move(self, card, new_col):
        if new_col == 1 and card.is_red and card.start_day == 0:
            card.start_day = self.model.day_count
        card.target_col = new_col
        card.target_x = self.model.column_x_positions[new_col]
        card.moving = True

    def move_cards(self):
        speed = int(self.view.anim_speed.get())
        for card in self.model.cards:
            if card.moving and card.target_x is not None:
                drawing = self.card_drawings.get(card.birth_id)
                if not drawing:
                    continue
                cur_x = drawing["x"]
                tgt_x = card.target_x
                if abs(tgt_x - cur_x) <= speed:
                    dx = tgt_x - cur_x
                    self.view.move_card(drawing, dx)
                    card.x = tgt_x
                    old_col = card.col
                    card.col = card.target_col
                    card.moving = False
                    card.target_x = None
                    card.target_col = None
                    if card.col == 7:
                        card.finish_day = self.model.day_count
                        card.cycle_time = card.finish_day - card.start_day
                    self.restack_column(old_col)
                    self.restack_column(card.col)
                else:
                    direction = 1 if tgt_x > cur_x else -1
                    dx = direction * speed
                    self.view.move_card(drawing, dx)
                    card.x = drawing["x"]
        self.move_cards_id = self.view.after(15, self.move_cards)

    def restack_column(self, col):
        cards_in_col = [c for c in self.model.cards if c.col == col and not c.moving]
        cards_in_col.sort(key=lambda c: c.birth_id)
        base_y = 100
        for i, card in enumerate(cards_in_col):
            new_y = base_y + i * 35
            drawing = self.card_drawings.get(card.birth_id)
            if drawing:
                dy = new_y - drawing["y"]
                if dy != 0:
                    self.view.canvas.move(drawing["rect"], 0, dy)
                    self.view.canvas.move(drawing["text"], 0, dy)
                    self.view.canvas.move(drawing["shadow"], 0, dy)
                    drawing["y"] = new_y
        # Aktualisiere den maximalen Kartenwert für Wartespalten:
        if col in [2, 4, 6]:
            count = len([c for c in self.model.cards if c.col == col and not c.moving])
            if count > self.model.column_max_count[col]:
                self.model.column_max_count[col] = count
                self.view.canvas.itemconfigure(self.view.header_text_ids[col], 
                                               text=self.view.get_column_header_text(col))

    def stop_simulation(self):
        if self.move_cards_id:
            self.view.after_cancel(self.move_cards_id)
        if self.decide_moves_id:
            self.view.after_cancel(self.decide_moves_id)
        self.model.round_counter += 1
        print("Roundcounter:", self.model.round_counter)
        # "In Progress": Alle Karten außer Backlog (0) und Done (7)
        in_progress = sum(1 for c in self.model.cards if c.col not in (0, 7))
        done_count = sum(1 for c in self.model.cards if c.col == 7)
        red_cycle = next((c.cycle_time for c in self.model.cards if c.is_red and c.cycle_time is not None), 0)
        throughput = done_count / red_cycle if red_cycle != 0 else 0
        flow_eff = 0
        red_card = next((c for c in self.model.cards if c.is_red), None)
        if red_card:
            total = red_card.BZ + red_card.WZ
            if total > 0:
                flow_eff = (red_card.BZ / total) * 100
        vals = [self.model.round_counter, self.model.wip_limit,
                f"{red_cycle:.2f}", f"{flow_eff:.2f}%", in_progress, done_count,
                f"{throughput:.2f}"]
        self.view.add_table_row(vals)

    def generate_red_card(self):
        if not self.model.red_card_generated:
            backlog_cards = [c for c in self.model.cards if c.col == 0 and not c.moving]
            if backlog_cards:
                backlog_cards.sort(key=lambda x: x.birth_id)
                red_card = backlog_cards[0]
                red_card.is_red = True
                red_card.processing_time = 0
                self.model.red_card_generated = True
                drawing = self.card_drawings.get(red_card.birth_id)
                if drawing:
                    self.view.canvas.itemconfigure(drawing["rect"], fill="#ca0633")

# --------------------- Hauptprogramm ---------------------
if __name__ == "__main__":
    controller = KanbanController()
    controller.view.mainloop()
