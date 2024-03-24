// this file needs to be polyfilled manually if needed

export function screen_init(): HTMLTextAreaElement|null {
    const cons = document.querySelector<HTMLTextAreaElement>("#console");
    if (cons) return cons;
    window.alert("HTML lacks DIV element with ID: \"console\"");
    return null;
}

export class Terminal {
    private terminal: HTMLTextAreaElement;
    private stick_to_bottom: boolean = true;

    constructor(terminal: HTMLTextAreaElement, init_txt?: string) {
        this.terminal = terminal;
        this.terminal.innerHTML = init_txt || "";

        this.terminal.style.resize = "none";

        this.terminal.addEventListener("scroll", () => {
            if (terminal.scrollHeight == terminal.scrollTop+window.innerHeight) this.stick_to_bottom = true;
            else this.stick_to_bottom = false;
        });
    }

    private change() {
        if (this.stick_to_bottom) this.scroll_to_bottom();
    }

    public add(msg: string) {
        this.terminal.innerHTML += msg;
        this.change();
    }

    // public log(type: string, log: string) {
    //     this.add(`${`[${type.toUpperCase()}]`.padStart(13, " ")} ${log}\n`);
    // }

    public set(txt: string) {
        this.terminal.innerHTML = txt;
        this.change();
    }

    public scroll_to_bottom() {
        this.terminal.scrollTop = this.terminal.scrollHeight;
    }

    public scroll_to_top() {
        this.terminal.scrollTop = 0;
    }
}