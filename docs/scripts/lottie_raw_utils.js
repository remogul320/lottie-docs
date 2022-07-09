class LottiePlayer
{
    constructor(container, lottie, auto_load=true, custom_options={})
    {
        if ( typeof container == "string" )
            this.container = document.getElementById(container);
        else
            this.container = container;

        this.lottie = lottie;

        this.anim = null;

        this.load_ok = true;
        this.autoplay = true;

        this.custom_options = custom_options;

        if ( auto_load )
            this.reload();
    }

    reload(extra_options={})
    {
        var options = {
            container: this.container,
            renderer: 'svg',
            loop: true,
            autoplay: this.autoplay,
            ...this.custom_options,
            ...extra_options,
        };

        this.on_reload();

        if ( !this.lottie )
            return;
        else if ( typeof this.lottie == "string" )
            options.path = this.lottie;
        else
            options.animationData = lottie_clone(this.lottie);

        let frame;

        if ( this.anim != null )
        {
            frame = this.anim.currentFrame;
            this.clear();
        }

        if ( this.load_ok )
        {
            this.anim = bodymovin.loadAnimation(options);
            if ( frame != undefined )
                this.go_to_frame(frame);
        }
    }

    play()
    {
        this.anim.play();
        this.autoplay = true;
    }

    pause()
    {
        this.anim.pause();
        this.autoplay = false;
    }

    on_reload()
    {
    }

    clear()
    {
        try {
            if ( this.anim )
            {
                this.anim.destroy();
                this.anim = null;
            }
        } catch ( e ) {}
    }

    go_to_frame(frame)
    {
        if ( this.autoplay )
            this.anim.goToAndPlay(frame, true);
        else
            this.anim.goToAndStop(frame, true);
    }
}

class PlaygroundPlayer extends LottiePlayer
{
    constructor(id, json_viewer_id, container, lottie, update_func, custom_options={})
    {
        super(container, lottie, false, custom_options);
        this.id = id;
        this.update_func = update_func.bind(this);
        this.json_viewer_contents = undefined;
        this.json_viewer_id = json_viewer_id;
        this.reload();
        // need to defer to wait for hljs to load
//         window.addEventListener("load", this.show_json.bind(this));
    }

    on_reload()
    {
        var data = Object.fromEntries(
            Array.from(document.querySelectorAll(`*[data-lottie-input='${this.id}']`))
            .map(a => {
                var value = a.value;
                if ( ["number", "range"].includes(a.type) )
                    value = Number(a.value);
                else if ( a.type == "checkbox" )
                    value = a.checked;
                return [a.name, value];
            })
        );
        this.update_func(this.lottie, data);
        if ( this.json_viewer_contents !== undefined )
            this.set_json(this.json_viewer_id, this.json_viewer_contents);
    }

    set_json(element_id, contents)
    {
        var raw_json = JSON.stringify(contents, undefined, 4);
        var pretty_json = hljs.highlight("json", raw_json).value;
        document.getElementById(element_id).innerHTML = pretty_json;
    }
}


// parse/stringify because the player modifies the passed object
function lottie_clone(json)
{
    return JSON.parse(JSON.stringify(json));
}


function syntax_edit_update(element, text)
{
    let result_element = element.parentElement.querySelector("code");
    if ( text[text.length-1] == "\n" )
        text += " ";
    result_element.innerHTML = hljs.highlight(element.dataset.lang, text).value;
}

function syntax_edit_scroll(element)
{
    let result_element = element.parentElement.querySelector("pre");
    result_element.scrollTop = element.scrollTop;
    result_element.scrollLeft = element.scrollLeft;
}

function syntax_edit_tab(element, event)
{
    let code = element.value;
    if ( event.key == "Tab" )
    {
        event.preventDefault();
        let before_tab = code.slice(0, element.selectionStart);
        let after_tab = code.slice(element.selectionEnd, element.value.length);
        let cursor_pos = element.selectionEnd + 4;
        element.value = before_tab + "    " + after_tab;
        element.selectionStart = cursor_pos;
        element.selectionEnd = cursor_pos;
        syntax_edit_update(element, element.value);
    }
}

function download_json(data, filename, indent=0)
{
    var element = document.createElement("a");
    element.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, indent)));
    element.setAttribute("download", filename);
    element.click();
}
