// Current year in the footer
document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
});

// A tiny terminal in the hero. Static, except `kubectl get nodes`, which reads /api/rack from
// this same server.
const out = document.getElementById("term-out");
const input = document.getElementById("term-in");
const bootedAt = Date.now();
const history = [];
let historyIndex = 0;

const files = {
    "about.txt":
        "Java backend developer based in Germany.\n" +
        "M.Sc. Computer Science, focus on graph databases.\n" +
        "Currently building things at VisualVest in Frankfurt.",
    "experience.log":
        "2026–now   VisualVest              Java Backend Development\n" +
        "2023–2026  KNIME                   Java Development\n" +
        "2023–2026  University of Konstanz  M.Sc. Computer Science\n" +
        "2022–2023  University of Konstanz  Full Stack Development\n" +
        "2022       Logistics Provider      Full Stack Development\n" +
        "2020–2023  University of Konstanz  B.Sc. Computer Science",
    "contact.txt": "jannes@mlrjs.eu",
    "master_thesis.pdf": "binary file. try 'open master_thesis.pdf'.",
    "bachelor_thesis.pdf": "binary file. try 'open bachelor_thesis.pdf'.",
    "pact.md": "Permission denied. Some contracts are read only after signing. Try 'pact'.",
};

const theses = {
    "master_thesis.pdf": "https://cdn.faustinus.eu/Master_Thesis.pdf",
    "bachelor_thesis.pdf": "https://cdn.faustinus.eu/Bachelor_Thesis.pdf",
};

const commands = {
    help: () =>
        "available commands:\n" +
        "  whoami        who is this\n" +
        "  ls            list files\n" +
        "  cat <file>    print a file\n" +
        "  open <file>   open a thesis pdf\n" +
        "  experience    jump to the timeline\n" +
        "  github        open GitHub\n" +
        "  contact       write me an email\n" +
        "  neofetch      system info\n" +
        "  uptime        how long this tab has been up\n" +
        "  clear         clear the screen\n" +
        "there may be a few more.",
    whoami: () => "jannes, a java backend developer. scroll down for the long version.",
    ls: () => Object.keys(files).join("  "),
    cat: (args) => {
        if (!args[0]) return "cat: missing file operand";
        return files[args[0]] ?? `cat: ${args[0]}: No such file or directory`;
    },
    experience: () => {
        document.getElementById("Experience").scrollIntoView({ behavior: "smooth" });
        return "scrolling to experience…";
    },
    open: (args) => {
        const url = theses[args[0]];
        if (!url) return `open: ${args[0] ?? ""}: cannot open`;
        window.open(url, "_blank", "noopener");
        return `opening ${args[0]}…`;
    },
    github: () => {
        window.open("https://github.com/Hypercookie", "_blank");
        return "opening github.com/Hypercookie…";
    },
    contact: () => {
        window.location.href = "mailto:jannes@mlrjs.eu";
        return "opening your mail client…";
    },
    neofetch: () =>
        " ▆▆▆▆▆▆   jannes@mlrjs\n" +
        " ▆▆▆▆     ------------\n" +
        " ▆▆   ●   os: k3s on hetzner, falkenstein\n" +
        "          shell: java 21, mostly\n" +
        "          focus: graph databases\n" +
        "          theme: faustinus (ink / ember)\n" +
        `          uptime: ${uptime()}`,
    uptime: () => `up ${uptime()}, 1 user, load average: 0.00, 0.00, 0.00`,
    date: () => new Date().toString(),
    echo: (args) => args.join(" "),
    pwd: () => "/home/jannes",
    cd: () => "you are already where you need to be.",
    sudo: () => "jannes is not in the sudoers file. This incident will be reported.",
    rm: () => "nice try.",
    vim: () => "you are now trapped. just kidding: you can't run vim in here.",
    exit: () => "there is no escape. (try closing the tab)",
    "kubectl": (args) => {
        const sub = args.join(" ");
        if (sub === "get pods")
            return "NAME                READY   STATUS    RESTARTS   AGE\nlanding-7f9c4b-x2k  1/1     Running   0          " + uptime();
        if (sub === "get nodes") return kubectlGetNodes();
        return "usage: kubectl get pods|nodes";
    },
    pact: () =>
        "Werd ich zum Augenblicke sagen:\n" +
        "Verweile doch! du bist so schön!\n" +
        "Dann magst du mich in Fesseln schlagen…\n" +
        "— Goethe, Faust I\n\n" +
        "pact signed. the dot stays on. type 'contact' to seal it.",
    faust: () => commands.pact(),
    clear: () => {
        out.replaceChildren();
        return null;
    },
};

// The only command that asks the server: real data from /api/rack (see the live rack below).
async function kubectlGetNodes() {
    const d = await fetchRack();
    if (!d) return "Unable to connect to the server: i/o timeout";
    const pad = (s, w) => String(s).padEnd(w);
    const pct = (v) => (v === null ? "?" : `${v}%`);
    const names = d.nodes.map((n, i) => n.name ?? `u${i + 1}`);
    const w = Math.max(4, ...names.map((s) => s.length)) + 2;
    return [
        pad("NAME", w) + pad("STATUS", 10) + pad("CPU", 6) + "MEMORY",
        ...d.nodes.map((n, i) => pad(names[i], w) + pad(n.ready ? "Ready" : "NotReady", 10) + pad(pct(n.cpu), 6) + pct(n.mem)),
    ].join("\n");
}

function uptime() {
    const s = Math.floor((Date.now() - bootedAt) / 1000);
    const m = Math.floor(s / 60);
    return m ? `${m} min ${s % 60} s` : `${s} s`;
}

function print(text, className = "") {
    const line = document.createElement("div");
    line.className = className;
    line.textContent = text;
    out.append(line);
    out.scrollTop = out.scrollHeight;
}

function run(raw) {
    const line = raw.trim();
    if (!line) return;
    history.push(line);
    historyIndex = history.length;
    print(`~ $ ${line}`, "text-steel");
    const [name, ...args] = line.split(/\s+/);
    const command = commands[name.toLowerCase()];
    if (!command) {
        print(`${name}: command not found. try 'help'.`, "text-ember");
        return;
    }
    const result = command(args);
    if (result instanceof Promise) result.then((text) => text && print(text));
    else if (result) print(result);
}

if (out && input) {
    input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
            run(input.value);
            input.value = "";
        } else if (ev.key === "ArrowUp" && historyIndex > 0) {
            ev.preventDefault();
            input.value = history[--historyIndex];
        } else if (ev.key === "ArrowDown") {
            ev.preventDefault();
            historyIndex = Math.min(historyIndex + 1, history.length);
            input.value = history[historyIndex] ?? "";
        } else if (ev.key === "Tab" && input.value) {
            const [name, ...rest] = input.value.split(" ");
            const pool = rest.length ? Object.keys(files) : Object.keys(commands);
            const prefix = rest.length ? rest[rest.length - 1] : name;
            const match = pool.find((c) => c.startsWith(prefix));
            if (match) {
                ev.preventDefault();
                input.value = rest.length ? [name, ...rest.slice(0, -1), match].join(" ") : match;
            }
        }
    });
}

// Rack mode: hover works on desktop, a click (or Enter) pins it
const rack = document.getElementById("rack");
rack?.addEventListener("click", () => {
    const on = rack.classList.toggle("is-rack");
    rack.setAttribute("aria-pressed", String(on));
});

// Live rack: the three units are the cluster's three servers. Data comes from /api/rack on this
// same server (no third party). Anything wrong (slow, error, odd shape, stale) and the rack shows
// its static default again.
const RACK_TIMEOUT_MS = 1500;
const RACK_MAX_AGE_S = 120;
const RACK_POLL_MS = 30000;

async function fetchRack() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), RACK_TIMEOUT_MS);
    try {
        const res = await fetch("/api/rack", { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) return null;
        const data = await res.json();
        if (!validRack(data)) return null;
        // Age against the server's clock (Date header), so a wrong local clock does not matter.
        const now = Date.parse(res.headers.get("Date") ?? "") || Date.now();
        if (Math.abs(now / 1000 - data.ts) > RACK_MAX_AGE_S) return null;
        return data;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function validRack(d) {
    const pct = (v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 100);
    const name = (v) => v === undefined || (typeof v === "string" && /^[a-z0-9][a-z0-9-]{0,31}$/.test(v));
    return (
        d !== null &&
        typeof d === "object" &&
        Array.isArray(d.nodes) &&
        d.nodes.length >= 1 &&
        d.nodes.length <= 8 &&
        d.nodes.every((n) => n && typeof n.ready === "boolean" && pct(n.cpu) && pct(n.mem) && name(n.name)) &&
        typeof d.ready7d === "number" &&
        d.ready7d >= 0 &&
        d.ready7d <= 100 &&
        Number.isInteger(d.pods) &&
        d.pods >= 0 &&
        Number.isInteger(d.ts)
    );
}

if (rack) {
    const slabs = [...rack.querySelectorAll(".slab")];
    const stats = rack.querySelector(".rack-stats");
    const leds = slabs.map((s) => [...s.querySelectorAll(".leds i")]);
    const labels = slabs.map((s) => s.querySelector(".unit-name"));
    const defaults = {
        stats: stats.textContent,
        labels: labels.map((l) => l?.textContent),
        leds: leds.map((pair) => pair.map((i) => i.className)),
    };
    let timer = null;
    let live = false;

    const memColor = (m) => (m === null ? "bg-steel" : m < 75 ? "bg-ok" : m < 90 ? "bg-warning" : "bg-ember");

    function showDefault() {
        if (!live) return;
        live = false;
        stats.textContent = defaults.stats;
        leds.forEach((pair, s) =>
            pair.forEach((i, k) => {
                i.className = defaults.leds[s][k];
                i.style.animationDuration = "";
            }),
        );
        slabs.forEach((s) => s.removeAttribute("title"));
        labels.forEach((l, s) => l && (l.textContent = defaults.labels[s]));
    }

    function showLive(d) {
        live = true;
        const ready = d.nodes.filter((n) => n.ready).length;
        stats.textContent = `${d.nodes.length}U · ${ready}/${d.nodes.length} ready · ${d.ready7d}% 7d · ${d.pods} pods`;
        slabs.forEach((slab, s) => {
            const n = d.nodes[s];
            const [power, load] = leds[s];
            if (labels[s]) labels[s].textContent = n?.name ? `u${s + 1} · ${n.name}` : defaults.labels[s];
            if (!n) {
                power.className = load.className = "bg-steel";
                slab.title = "empty slot";
                return;
            }
            power.className = n.ready ? "bg-ok" : "bg-ember";
            load.className = memColor(n.mem);
            // Busier server, faster blink: 1.6 s idle down to 0.4 s at full CPU.
            if (n.cpu !== null) load.style.animationDuration = `${1.6 - (n.cpu / 100) * 1.2}s`;
            slab.title = `${n.ready ? "ready" : "not ready"} · cpu ${n.cpu ?? "?"}% · mem ${n.mem ?? "?"}%`;
        });
    }

    async function refresh() {
        const d = await fetchRack();
        if (d) showLive(d);
        else showDefault();
    }

    const active = () => rack.matches(":hover") || rack.classList.contains("is-rack");

    function start() {
        if (timer) return;
        refresh();
        timer = setInterval(() => {
            if (active() && !document.hidden) refresh();
            else stop();
        }, RACK_POLL_MS);
    }

    function stop() {
        clearInterval(timer);
        timer = null;
    }

    rack.addEventListener("pointerenter", start);
    rack.addEventListener("focus", start);
    rack.addEventListener("click", start);
}

console.log(
    "-----------------------------------------\n" +
    "Welcome... to the secrets of the console!\n" +
    "[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]][([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]((!![]+[])[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+([][[]]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+!+[]]+(+[![]]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+!+[]]]+(!![]+[])[!+[]+!+[]+!+[]]+(+(!+[]+!+[]+!+[]+[+!+[]]))[(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([]+[])[([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]][([][[]]+[])[+!+[]]+(![]+[])[+!+[]]+((+[])[([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]+[])[+!+[]+[+!+[]]]+(!![]+[])[!+[]+!+[]+!+[]]]](!+[]+!+[]+!+[]+[!+[]+!+[]])+(![]+[])[+!+[]]+(![]+[])[!+[]+!+[]])()([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]][([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]((!![]+[])[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+([][[]]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+!+[]]+([]+[])[(![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(!![]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]()[+!+[]+[!+[]+!+[]]]+((![]+[])[+!+[]]+(![]+[])[!+[]+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+([][[]]+[])[+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+(!![]+[])[+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(+(+!+[]+[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+[!+[]+!+[]]+[+[]])+[])[+!+[]]+(+(+!+[]+[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+[!+[]+!+[]]+[+[]])+[])[+!+[]]+(+(+!+[]+[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+[!+[]+!+[]]+[+[]])+[])[+!+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+[+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+([][[]]+[])[+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+([][[]]+[])[+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[+[]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(!![]+[])[+[]]+[+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]+!+[]+!+[]]+(!![]+[])[+[]]+[!+[]+!+[]+!+[]+!+[]+!+[]]+[+!+[]])[(![]+[])[!+[]+!+[]+!+[]]+(+(!+[]+!+[]+[+!+[]]+[+!+[]]))[(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([]+[])[([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]][([][[]]+[])[+!+[]]+(![]+[])[+!+[]]+((+[])[([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]+[])[+!+[]+[+!+[]]]+(!![]+[])[!+[]+!+[]+!+[]]]](!+[]+!+[]+!+[]+[+!+[]])[+!+[]]+(![]+[])[!+[]+!+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(!![]+[])[+[]]]((!![]+[])[+[]])[([][(!![]+[])[!+[]+!+[]+!+[]]+([][[]]+[])[+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([![]]+[][[]])[+!+[]+[+[]]]+(!![]+[])[!+[]+!+[]+!+[]]+(![]+[])[!+[]+!+[]+!+[]]]()+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([![]]+[][[]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]](([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]][([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]((!![]+[])[+!+[]]+(!![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+([][[]]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+!+[]]+(![]+[+[]])[([![]]+[][[]])[+!+[]+[+[]]]+(!![]+[])[+[]]+(![]+[])[+!+[]]+(![]+[])[!+[]+!+[]]+([![]]+[][[]])[+!+[]+[+[]]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(![]+[])[!+[]+!+[]+!+[]]]()[+!+[]+[+[]]]+![]+(![]+[+[]])[([![]]+[][[]])[+!+[]+[+[]]]+(!![]+[])[+[]]+(![]+[])[+!+[]]+(![]+[])[!+[]+!+[]]+([![]]+[][[]])[+!+[]+[+[]]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(![]+[])[!+[]+!+[]+!+[]]]()[+!+[]+[+[]]])()[([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(![]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[])[+!+[]]+([][[]]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]((![]+[+[]])[([![]]+[][[]])[+!+[]+[+[]]]+(!![]+[])[+[]]+(![]+[])[+!+[]]+(![]+[])[!+[]+!+[]]+([![]]+[][[]])[+!+[]+[+[]]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(![]+[])[!+[]+!+[]+!+[]]]()[+!+[]+[+[]]])+[])[+!+[]])+([]+[])[(![]+[])[+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+([][[]]+[])[+!+[]]+(!![]+[])[+[]]+([][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]]+[])[!+[]+!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(![]+[])[!+[]+!+[]]+(!![]+[][(![]+[])[+[]]+(![]+[])[!+[]+!+[]]+(![]+[])[+!+[]]+(!![]+[])[+[]]])[+!+[]+[+[]]]+(!![]+[])[+!+[]]]()[+!+[]+[!+[]+!+[]]])())\n" +
    "-----------------------------------------"
);

