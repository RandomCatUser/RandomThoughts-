(function(){
    "use strict";

    var THEME_KEY="eb-theme",SPLIT_KEY="eb-split",DRAFT_KEY="eb-draft",DETAILS_KEY="eb-details";
    var SITE="https://randomcatuser.github.io/RandomThoughts-";
    var AUTHOR={name:"Dihan Ramanayaka",photo:"https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true"};

    var el={};
    ["title","subtitle","category","date","description","tags","slug","cover","coveralt"]
        .forEach(function(k){el[k]=document.getElementById("f-"+k);});
    el.featured=document.getElementById("f-featured");
    el.body=document.getElementById("f-body");
    el.wordcount=document.getElementById("wordcount");
    el.slugPreview=document.getElementById("slug-preview");
    el.pill=document.getElementById("pill");
    el.pillLabel=document.getElementById("pill-label");
    el.frame=document.getElementById("frame");
    el.previewTime=document.getElementById("preview-time");
    el.previewEmpty=document.getElementById("preview-empty");
    el.main=document.querySelector(".main");
    el.divider=document.getElementById("divider");
    el.details=document.getElementById("details");
    el.btnDetails=document.getElementById("btn-details");
    el.btnDetailsLabel=document.getElementById("btn-details-label");
    el.help=document.getElementById("help");
    el.btnHelp=document.getElementById("btn-help");
    el.btnPalette=document.getElementById("btn-palette");
    el.exportMenu=document.getElementById("export-menu");
    el.toast=document.getElementById("toast");
    el.th=document.getElementById("th");
    el.palette=document.getElementById("palette");
    el.paletteInput=document.getElementById("palette-input");
    el.paletteList=document.getElementById("palette-list");

    var slugTouched=false;

    /* ---------------- helpers ---------------- */
    function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
    function escAttr(s){return esc(s).replace(/`/g,"&#96;");}
    function jsStr(s){return String(s==null?"":s).replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n");}
    function slugify(s){return String(s||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60);}
    function todayDisplay(){var d=new Date(),m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return m[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();}
    function todayISO(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
    function displayToISO(disp){var m=/^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/.exec(String(disp||"").trim());if(!m)return todayISO();var mo={Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"};var mon=String(m[1]).charAt(0).toUpperCase()+String(m[1]).slice(1).toLowerCase();return m[3]+"-"+(mo[mon]||"01")+"-"+String(parseInt(m[2],10)).padStart(2,"0");}
    function timeNow(){var d=new Date(),h=d.getHours();return (h<10?"0":"")+h+":"+(d.getMinutes()<10?"0":"")+d.getMinutes();}
    function postsBaseUrl(){try{return new URL("../docs/posts/",window.location.href).href;}catch(e){return "";}}

    function toast(msg){el.toast.textContent=msg;el.toast.classList.add("show");clearTimeout(toast._t);toast._t=setTimeout(function(){el.toast.classList.remove("show");},1900);}
    function copyText(text,msg){
        function fb(){var t=document.createElement("textarea");t.value=text;t.style.cssText="position:fixed;opacity:0";document.body.appendChild(t);t.select();try{document.execCommand("copy");toast(msg||"Copied");}catch(e){toast("Copy failed");}document.body.removeChild(t);}
        if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(function(){toast(msg||"Copied");},fb);else fb();
    }

    /* ---------------- theme ---------------- */
    function applyTheme(t){document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem(THEME_KEY,t);}catch(e){}}
    applyTheme(localStorage.getItem(THEME_KEY)==="light"?"light":"dark");
    el.th.addEventListener("click",function(){applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");});

    /* ---------------- state ---------------- */
    function state(){
        var title=el.title.value.trim();
        var tags=el.tags.value.split(",").map(function(t){return t.trim();}).filter(Boolean);
        if(!el.slug.value.trim()&&title){el.slug.value=slugify(title);slugTouched=true;}
        var slug=el.slug.value.trim()||slugify(title)||"untitled";
        var date=el.date.value.trim()||todayDisplay();
        return {title:title,subtitle:el.subtitle.value.trim(),category:el.category.value.trim(),date:date,iso:displayToISO(date),description:el.description.value.trim(),tags:tags,slug:slug,cover:el.cover.value.trim(),coverAlt:el.coveralt.value.trim()||title,featured:el.featured.checked,body:el.body.value,filename:slug+".html"};
    }

    /* ---------------- markdown ---------------- */
    function decorateBody(md){
        var h="";
        try{h=(window.marked&&marked.parse?marked.parse(md||"",{gfm:true,breaks:true}):"");}catch(e){h="";}
        return h
            .replace(/<blockquote>/g,'<blockquote class="border-l-4 rt-quote pl-6 py-2 my-8 text-2xl font-serif italic">')
            .replace(/<h1>/g,'<h1 class="rt-body-title text-5xl font-bold mt-10 mb-8 tracking-tight">')
            .replace(/<h2>/g,'<h2 class="rt-body-title text-4xl font-bold mt-16 mb-6 tracking-tight">')
            .replace(/<h3>/g,'<h3 class="rt-body-title text-3xl font-bold mt-12 mb-4 tracking-tight">')
            .replace(/<img /g,'<img class="w-full object-cover rounded-2xl my-10" ');
    }

    /* ---------------- generated html ---------------- */
    function postHtml(){
        var s=state();
        var coverImg=s.cover?'<img src="'+escAttr(s.cover)+'" alt="'+escAttr(s.coverAlt)+'" class="w-full aspect-video object-cover rounded-2xl mb-12">':'';
        var body=decorateBody(s.body);
        var cat=s.category?'<span class="rt-body-cat text-xs uppercase tracking-[0.2em] font-bold">'+esc(s.category)+'</span>':'';
        var sub=s.subtitle?'<p class="text-xl rt-body-sub font-light italic">'+esc(s.subtitle)+'</p>':'';
        var canonical=SITE+"/posts/"+s.slug+".html";
        return [
            "<!DOCTYPE html>",'<html lang="en">','<head>',
            '    <meta charset="UTF-8">',
            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
            '    <title>'+esc(s.title||"Untitled")+" | Random Thoughts Digest</title>",
            '    <meta name="description" content="'+escAttr(s.description)+'">',
            '    <meta name="robots" content="index, follow">',
            '    <link rel="canonical" href="'+canonical+'">',
            '    <link rel="icon" type="image/webp" href="'+AUTHOR.photo+'">',
            "","    <!-- Open Graph -->",
            '    <meta property="og:type" content="article">',
            '    <meta property="og:site_name" content="Random Thoughts">',
            '    <meta property="og:title" content="'+escAttr(s.title||"Untitled")+" | Random Thoughts Digest\">",
            '    <meta property="og:description" content="'+escAttr(s.description)+'">',
            '    <meta property="og:url" content="'+canonical+'">',
            '    <meta property="og:image" content="'+escAttr(s.cover)+'">',
            '    <meta property="article:published_time" content="'+s.iso+'">',
            "","    <!-- Twitter Card -->",
            '    <meta name="twitter:card" content="summary">',
            '    <meta name="twitter:title" content="'+escAttr(s.title||"Untitled")+" | Random Thoughts Digest\">",
            '    <meta name="twitter:description" content="'+escAttr(s.description)+'">',
            '    <meta name="twitter:image" content="'+escAttr(s.cover)+'">',
            '    <script src="https://cdn.tailwindcss.com"><\/script>',
            "","    <!-- Fonts -->",
            '    <link rel="preconnect" href="https://fonts.googleapis.com">',
            '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
            '    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">',
            "","    <!-- Font Awesome -->",
            '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">',
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js"><\/script>',
            "","    <link rel='stylesheet' href='../assets/css/common.css'>",
            '    <link rel="stylesheet" href="posts.css">',
            '</head>','<body class="antialiased">',
            "",'    <div id="site-header"></div>',
            "",
            '    <main class="mx-auto max-w-3xl px-5 md:px-8 article-body">',
            '        <header class="mb-12">',
            cat?"            "+cat:"",
            '            <h1 class="rt-body-title text-5xl md:text-7xl font-bold mt-4 mb-6 tracking-tight italic">'+esc(s.title)+"</h1>",
            sub?"            "+sub:"",
            "        </header>","",coverImg?"        "+coverImg:"",
            body.split("\n").map(function(l){return "        "+l}).join("\n"),
            "",
            '        <footer class="mt-20 pt-10 border-t rt-foot text-sm">',
            "            <p>\uD55C\uC6B0\uACA9\uD569\uB2C8\uB2E4! \uAE00\uC744 \uB05D\uAE30\uBA74 \uB4E4\uC5EC\uC8FC\uC15C\uB2C8\uB2E4.</p>",
            "        </footer>","    </main>",
            "","    <div id='site-footer'></div>",
            "","    <div id='sc-player'></div>",
            "","    <script src='../assets/js/common.js'><\/script>",
            '</body>','</html>'
        ].join("\n")+"\n";
    }

    function entryJs(){
        var s=state();
        var tags=s.tags.length?s.tags.map(function(t){return '"'+jsStr(t)+'"'}).join(", "):'"General"';
        return [
            "    {",
            '        id: "'+jsStr(s.slug)+'",',
            '        title: "'+jsStr(s.title)+'",',
            '        description: "'+jsStr(s.description)+'",',
            '        cover: "'+jsStr(s.cover)+'",',
            '        coverAlt: "'+jsStr(s.coverAlt)+'",',
            "        tags: ["+tags+"],",
            '        date: "'+jsStr(s.date)+'",',
            '        url: "posts/'+jsStr(s.slug)+'.html",',
            "        featured: "+(s.featured?"true":"false")+",",
            "        contributors: [",
            '            { name: "'+jsStr(AUTHOR.name)+'", photo: "'+jsStr(AUTHOR.photo)+'" }',
            "        ]",
            "    },",""
        ].join("\n");
    }

    /* ---------------- live render ---------------- */
    function wordsOf(t){t=String(t||"").trim();return t?t.split(/\s+/).length:0;}

    function refreshMeta(){
        var s=state();
        var wd=wordsOf(s.body),mins=Math.max(1,Math.round(wd/180));
        el.wordcount.textContent=wd+" words · "+mins+" min read";
        el.slugPreview.textContent=s.slug;
        var showEmpty=(!s.title&&!s.body);
        el.frame.style.display=showEmpty?"none":"";
        el.previewEmpty.style.display=showEmpty?"flex":"none";
    }

    var _pv=null;
    function refreshPreview(){
        var doc=postHtml()
            .replace(/[\s]*<div id="site-header"><\/div>/,"")
            .replace(/[\s]*<div id='site-footer'><\/div>/,"")
            .replace(/[\s]*<div id='sc-player'><\/div>/,"")
            .replace(/[\s]*<script src='\.\.\/assets\/js\/common\.js'><\/script>/,"")
            .replace("<head>",'<head><base href="'+postsBaseUrl()+'">');
        el.frame.srcdoc=doc;
        el.previewTime.textContent="Updated "+timeNow();
    }
    function schedulePreview(){clearTimeout(_pv);_pv=setTimeout(function(){refreshMeta();refreshPreview();},450);}

    /* ---------------- draft save ---------------- */
    var _save=null;
    function fields(){return ["title","subtitle","category","date","description","tags","slug","cover","coveralt"];}
    function saveDraft(){
        var d={};fields().forEach(function(k){d[k]=el[k].value;});
        d.featured=el.featured.checked;d.body=el.body.value;d._saved=Date.now();
        try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d));}catch(e){}
        pillStatus(true);
    }
    function loadDraft(){try{var r=localStorage.getItem(DRAFT_KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
    function restoreDraft(){var d=loadDraft();if(!d)return false;fields().forEach(function(k){if(d[k]!=null)el[k].value=d[k];});if(d.featured)el.featured.checked=true;if(d.body)el.body.value=d.body;return true;}
    function clearDraft(){try{localStorage.removeItem(DRAFT_KEY);}catch(e){}pillStatus(false);}
    function pillStatus(ok){el.pillLabel.innerHTML=ok?'<b>saved '+timeNow()+'</b>':'unsaved ✎';}
    function scheduleSave(){clearTimeout(_save);pillStatus(false);_save=setTimeout(saveDraft,500);}

    /* ---------------- autosize body ---------------- */
    function autosize(t){t.style.height="auto";t.style.height=t.scrollHeight+"px";}

    /* ---------------- wire ---------------- */
    fields().forEach(function(k){el[k].addEventListener("input",function(){if(k==="title")slugTouched=false;scheduleMeta();schedulePreview();scheduleSave();});});
    el.slug.addEventListener("input",function(){slugTouched=true;el.slug.value=slugify(el.slug.value);schedulePreview();scheduleSave();});
    el.featured.addEventListener("change",scheduleSave);
    el.body.addEventListener("input",function(){autosize(el.body);schedulePreview();scheduleSave();});

    function scheduleMeta(){refreshMeta();}

    function render(){refreshMeta();refreshPreview();}

    /* export menu */
    function downloadPost(){
        var s=state(),bl=new Blob([postHtml()],{type:"text/html;charset=utf-8"}),a=document.createElement("a");
        a.href=URL.createObjectURL(bl);a.download=s.filename;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);
        toast("saved "+s.filename+" ♡");
    }
    document.getElementById("btn-export").addEventListener("click",function(e){e.stopPropagation();el.exportMenu.classList.toggle("open");});
    document.addEventListener("click",function(e){if(!e.target.closest(".menu-wrap"))el.exportMenu.classList.remove("open");});
    Array.prototype.forEach.call(el.exportMenu.querySelectorAll("button[data-act]"),function(b){
        b.addEventListener("click",function(){
            var act=b.getAttribute("data-act");
            if(act==="html")copyText(postHtml(),"HTML copied ♡");
            else if(act==="entry")copyText(entryJs(),"RT_POSTS entry copied ♡");
            else downloadPost();
            el.exportMenu.classList.remove("open");
        });
    });

    document.getElementById("btn-save").addEventListener("click",function(){saveDraft();toast("saved ♡");});
    document.getElementById("btn-new").addEventListener("click",function(){
        if(!confirm("Start a new draft? Your current draft will be cleared."))return;
        clearDraft();fields().forEach(function(k){el[k].value="";});
        el.featured.checked=false;slugTouched=false;el.date.value=todayDisplay();el.body.value="";autosize(el.body);
        render();toast("new draft ✦");
    });
    document.getElementById("btn-refresh").addEventListener("click",refreshPreview);

    /* details drawer */
    var detailsOpen=localStorage.getItem(DETAILS_KEY)==="1";
    el.details.classList.toggle("open",detailsOpen);
    el.btnDetailsLabel.textContent=detailsOpen?"Hide details":"Details";
    el.btnDetails.addEventListener("click",function(){
        var open=!el.details.classList.contains("open");
        el.details.classList.toggle("open",open);el.btnDetailsLabel.textContent=open?"Hide details":"Details";
        try{localStorage.setItem(DETAILS_KEY,open?"1":"0");}catch(e){}
    });

    /* markdown lightbox */
    var helpOpen=false;
    function setHelp(open){
        helpOpen=!!open;
        el.help.classList.toggle("open",helpOpen);
    }
    el.btnHelp.addEventListener("click",function(){setHelp(true);});
    Array.prototype.forEach.call(el.help.querySelectorAll("[data-close]"),function(b){
        b.addEventListener("click",function(){setHelp(false);});
    });
    document.addEventListener("keydown",function(e){if(e.key==="Escape"){setHelp(false);closePalette();}});

    /* ---------------- command palette ---------------- */
    function insertAtBody(before,after,placeholder){
        var t=el.body,s=t.selectionStart,e=t.selectionEnd,v=t.value;
        var sel=v.slice(s,e)||placeholder||"";
        t.value=v.slice(0,s)+before+sel+after+v.slice(e);
        t.focus();t.setSelectionRange(s+before.length,s+before.length+sel.length);
        autosize(t);schedulePreview();scheduleSave();
    }
    function insertLine(prefix){
        var t=el.body,s=t.selectionStart,v=t.value;
        var ls=v.lastIndexOf("\n",s-1)+1;
        t.value=v.slice(0,ls)+prefix+v.slice(ls);
        t.focus();t.setSelectionRange(ls+prefix.length,ls+prefix.length);
        autosize(t);schedulePreview();scheduleSave();
    }
    var commands=[
        {id:"h2",g:"Insert",ic:"fa-solid fa-heading",label:"Heading 2",desc:"## heading",match:["head","title"],run:function(){insertLine("## ");}},
        {id:"h3",g:"Insert",ic:"fa-solid fa-heading",label:"Heading 3",desc:"### heading",match:["head"],run:function(){insertLine("### ");}},
        {id:"quote",g:"Insert",ic:"fa-solid fa-quote-left",label:"Quote",desc:"> pull quote",match:["blockquote"],run:function(){insertLine("> ");}},
        {id:"list",g:"Insert",ic:"fa-solid fa-list-ul",label:"List",desc:"- item",match:["bullet","ul"],run:function(){insertLine("- ");}},
        {id:"bold",g:"Insert",ic:"fa-solid fa-bold",label:"Bold",desc:"**bold**",run:function(){insertAtBody("**","**","bold");}},
        {id:"italic",g:"Insert",ic:"fa-solid fa-italic",label:"Italic",desc:"*italic*",run:function(){insertAtBody("*","*","italic");}},
        {id:"link",g:"Insert",ic:"fa-solid fa-link",label:"Link",desc:"[text](url)",run:function(){insertAtBody("[","](url)","text");}},
        {id:"image",g:"Insert",ic:"fa-regular fa-image",label:"Image",desc:"![alt](url)",run:function(){insertAtBody("![","](url)","alt");}},
        {id:"code",g:"Insert",ic:"fa-solid fa-code",label:"Inline code",desc:"`code`",run:function(){insertAtBody("`","`","code");}},
        {id:"codeblock",g:"Insert",ic:"fa-solid fa-terminal",label:"Code block",desc:"```\ncode\n```",match:["fence"],run:function(){insertAtBody("```\n","\n```","code");}},
        {id:"theme",g:"Actions",ic:"fa-solid fa-circle-half-stroke",label:"Toggle theme",desc:"dark · light",match:["dark","light"],run:function(){applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");}},
        {id:"help",g:"Actions",ic:"fa-solid fa-circle-question",label:"Markdown help",desc:"cheat sheet",match:["md","cheatsheet"],run:function(){setHelp(true);}},
        {id:"details",g:"Actions",ic:"fa-solid fa-sliders",label:"Toggle details",desc:"post meta",run:function(){el.btnDetails.click();}},
        {id:"new",g:"Actions",ic:"fa-solid fa-plus",label:"New draft",desc:"start fresh",run:function(){document.getElementById("btn-new").click();}},
        {id:"save",g:"Actions",ic:"fa-regular fa-floppy-disk",label:"Save draft",desc:"ctrl+s",run:function(){saveDraft();toast("saved ♡");}},
        {id:"refresh",g:"Actions",ic:"fa-solid fa-rotate",label:"Refresh preview",desc:"rebuild",run:function(){refreshPreview();}},
        {id:"copyhtml",g:"Actions",ic:"fa-solid fa-code",label:"Copy post HTML",desc:"export",run:function(){copyText(postHtml(),"HTML copied ♡");}},
        {id:"copyentry",g:"Actions",ic:"fa-solid fa-list",label:"Copy RT_POSTS entry",desc:"export",run:function(){copyText(entryJs(),"RT_POSTS entry copied ♡");}},
        {id:"download",g:"Actions",ic:"fa-solid fa-download",label:"Download post",desc:"export",run:function(){downloadPost();}},
        {id:"blog",g:"Actions",ic:"fa-solid fa-arrow-up-right-from-square",label:"Open blog",desc:"docs",run:function(){window.location.href="../docs/index.html";}}
    ];
    var commandsById={};
    commands.forEach(function(c){commandsById[c.id]=c;});
    var palSel=0,palItems=[];

    function openPalette(){el.palette.classList.add("open");el.paletteInput.value="";renderPalette();el.paletteInput.focus();}
    function closePalette(){el.palette.classList.remove("open");}
    function togglePalette(){if(el.palette.classList.contains("open"))closePalette();else openPalette();}

    function renderPalette(){
        var q=el.paletteInput.value.trim().toLowerCase();
        var shown=[];
        commands.forEach(function(c){
            if(!q||c.label.toLowerCase().indexOf(q)!==-1||(c.desc||"").toLowerCase().indexOf(q)!==-1||(c.match||[]).some(function(m){return m.indexOf(q)!==-1;}))
                shown.push(c);
        });
        var html="",last=null;
        shown.forEach(function(c){
            if(c.g!==last){html+='<div class="palette-group">'+c.g+'</div>';last=c.g;}
            html+='<button type="button" class="palette-item" data-cmd="'+c.id+'"><span class="pi-ic"><i class="'+c.ic+'"></i></span><span>'+c.label+'</span><span class="pi-desc">'+c.desc+'</span></button>';
        });
        el.paletteList.innerHTML=html||'<div class="palette-empty">nothing found — try “heading” or “save”</div>';
        palItems=Array.prototype.slice.call(el.paletteList.querySelectorAll(".palette-item"));
        setPalSel(0);
    }
    function setPalSel(i){
        if(!palItems.length)return;
        if(i<0)i=palItems.length-1;if(i>=palItems.length)i=0;
        palItems.forEach(function(b,k){b.classList.toggle("sel",k===i);});
        palSel=i;
        var b=palItems[i];if(b&&b.scrollIntoView)b.scrollIntoView({block:"nearest"});
    }
    function runPaletteItem(b){
        var c=commandsById[b.getAttribute("data-cmd")];
        if(c){closePalette();c.run();}
    }

    el.btnPalette.addEventListener("click",togglePalette);
    el.paletteInput.addEventListener("input",renderPalette);
    el.paletteInput.addEventListener("keydown",function(e){
        if(e.key==="ArrowDown"){e.preventDefault();setPalSel(palSel+1);}
        else if(e.key==="ArrowUp"){e.preventDefault();setPalSel(palSel-1);}
        else if(e.key==="Enter"){e.preventDefault();if(palItems[palSel])runPaletteItem(palItems[palSel]);}
        else if(e.key==="Escape"){e.preventDefault();closePalette();}
    });
    el.paletteList.addEventListener("click",function(e){
        var b=e.target.closest(".palette-item");
        if(b)runPaletteItem(b);
    });
    Array.prototype.forEach.call(el.palette.querySelectorAll("[data-pclose]"),function(b){
        b.addEventListener("click",closePalette);
    });

    /* divider */
    var savedSplit=localStorage.getItem(SPLIT_KEY);
    if(savedSplit)el.main.style.setProperty("--split",savedSplit+"%");
    el.divider.addEventListener("pointerdown",function(e){
        if(e.button!==0&&e.pointerType==="mouse")return;
        e.preventDefault();el.divider.classList.add("hot");el.divider.setPointerCapture(e.pointerId);
        function move(ev){var r=el.main.getBoundingClientRect(),pct=((ev.clientX-r.left)/r.width)*100;pct=Math.max(30,Math.min(68,pct));el.main.style.setProperty("--split",pct+"%");}
        function up(){
            el.divider.classList.remove("hot");
            el.divider.removeEventListener("pointermove",move);
            el.divider.removeEventListener("pointerup",up);
            try{localStorage.setItem(SPLIT_KEY,el.main.style.getPropertyValue("--split"));}catch(err){}
        }
        el.divider.addEventListener("pointermove",move);
        el.divider.addEventListener("pointerup",up);
        el.divider.addEventListener("pointercancel",up);
    });
    el.divider.addEventListener("dblclick",function(){el.main.style.setProperty("--split","46%");try{localStorage.setItem(SPLIT_KEY,"46%");}catch(e){}});

    /* ctrl/cmd+s, ctrl/cmd+k */
    document.addEventListener("keydown",function(e){
        if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveDraft();toast("saved ♡");}
        else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();togglePalette();}
    });

    /* auto-save on exit */
    window.addEventListener("beforeunload",function(){saveDraft();});

    /* ---------------- init ---------------- */
    el.date.value=todayDisplay();
    var restored=restoreDraft();
    slugTouched=restored;
    if(restored)pillStatus(true);
    autosize(el.body);
    render();
})();