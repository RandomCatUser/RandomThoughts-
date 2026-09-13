(function(){
    "use strict";
    var THEME_KEY="eb-theme",SPLIT_KEY="eb-split",DRAFT_KEY="eb-draft",DETAILS_KEY="eb-details",SIDEBAR_KEY="eb-sidebar",VIEW_KEY="eb-view",ZEN_KEY="eb-zen",INSP_KEY="eb-insp",LIB_KEY="eb-library",AUTOSAVE_KEY="eb-autosave";
    var HTML_MODE=true; // full HTML in editor from now on — no markdown
    var SITE="https://randomcatuser.github.io/RandomThoughts-";
    var AUTHOR={name:"Dihan Ramanayaka",photo:"https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true"};

    var el={};
    ["title","subtitle","category","date","description","tags","slug"]
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
    el.importMenu=document.getElementById("import-menu");
    el.saveMenu=document.getElementById("save-menu");
    el.importHtmlInput=document.getElementById("import-html-input");
    el.importMdInput=document.getElementById("import-md-input");
    el.toast=document.getElementById("toast");
    el.th=document.getElementById("th");
    el.palette=document.getElementById("palette");
    el.paletteInput=document.getElementById("palette-input");
    el.paletteList=document.getElementById("palette-list");
    el.docTitle=document.getElementById("doc-title");
    el.statusChars=document.getElementById("status-chars");
    el.statusRead=document.getElementById("status-read");
    el.previewStage=document.getElementById("preview-stage");
    el.workspace=document.getElementById("workspace");
    el.sidebar=document.getElementById("sidebar");
    el.inspector=document.getElementById("inspector");
    el.outline=document.getElementById("outline");
    el.outlineCount=document.getElementById("outline-count");
    el.advMenu=document.getElementById("adv-menu");
    el.library=document.getElementById("library");
    el.libList=document.getElementById("lib-list");
    el.libSearch=document.getElementById("lib-search");

    var slugTouched=false;

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

    function applyTheme(t){
        document.documentElement.setAttribute("data-theme",t);
        try{localStorage.setItem(THEME_KEY,t);}catch(e){}
        // sync highlight.js theme
        var light=document.getElementById("hljs-light"), dark=document.getElementById("hljs-dark");
        if(light&&dark){ light.disabled = t==="dark"; dark.disabled = t!=="dark"; }
    }
    applyTheme(localStorage.getItem(THEME_KEY)==="light"?"light":"dark");
    el.th.addEventListener("click",function(){applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");});

    function state(){
        var title=el.title.value.trim();
        var tags=el.tags.value.split(",").map(function(t){return t.trim();}).filter(Boolean);
        if(!el.slug.value.trim()&&title){el.slug.value=slugify(title);slugTouched=true;}
        var slug=el.slug.value.trim()||slugify(title)||"untitled";
        var date=el.date.value.trim()||todayDisplay();
        return {title:title,subtitle:el.subtitle.value.trim(),category:el.category.value.trim(),date:date,iso:displayToISO(date),description:el.description.value.trim(),tags:tags,slug:slug,featured:el.featured.checked,body:el.body.value,filename:slug+".html"};
    }

    function dedentMd(md){
        if(!md) return md;
        var lines=String(md).split("\n");
        var indents=[];
        for(var i=0;i<lines.length;i++){
            var l=lines[i];
            if(!l.trim()||l.trim().indexOf("```")===0) continue;
            var m=/^([ \t]*)/.exec(l);
            if(m){
                var ind=m[1].replace(/\t/g,"    ").length;
                if(ind>=2) indents.push(ind);
            }
        }
        if(!indents.length) return md;
        var minInd=Math.min.apply(null,indents);
        var countCentered=indents.filter(function(x){return x>=minInd;}).length;
        if(minInd>=2 && countCentered>=lines.length/2){
            var ded=Math.min(minInd,8);
            for(var i=0;i<lines.length;i++){
                if(!lines[i].trim()||lines[i].trim().indexOf("```")===0) continue;
                var c=0, idx=0, l=lines[i];
                while(idx<l.length && c<ded){
                    if(l[idx]===" "){c++;idx++;}
                    else if(l[idx]==="\t"){c+=4;idx++;}
                    else break;
                }
                lines[i]=l.slice(idx);
            }
            return lines.join("\n");
        }
        return md;
    }
    function smartHeadings(md){
        if(!md) return md;
        var lines=String(md).split("\n");
        var out=[];
        for(var i=0;i<lines.length;i++){
            var l=lines[i];
            var s=l.trim();
            if(!s || s.indexOf("#")===0 || s.indexOf("-")===0 || s.indexOf("*")===0 || s.indexOf(">")===0 || s.indexOf("```")===0 || s.indexOf("!")===0 || s.indexOf("<")===0 || s.indexOf("`")===0){
                out.push(l); continue;
            }
            var prev=i>0?lines[i-1].trim():"";
            var nxt=i+1<lines.length?lines[i+1].trim():"";
            var words=s.split(/\s+/);
            if(words.length>=2 && words.length<=8 && s.length<70 && s.indexOf(".")===-1 && /^[A-Z]/.test(s) && !prev && nxt && nxt.length>40){
                out.push(HTML_MODE ? "<h2>"+esc(s)+"</h2>" : "## "+s);
            } else out.push(l);
        }
        return out.join("\n");
    }
    function decorateBody(md){
        var src=String(md||"");
        src=dedentMd(src);
        src=smartHeadings(src);
        // HTML_MODE: body is already full HTML — just inject classes, don't markdown-parse
        var isHtml = HTML_MODE || /<\s*(h1|h2|h3|p|img|blockquote|ul|ol|pre|a)\b/i.test(src);
        var h="";
        if(isHtml){
            // treat as HTML snippet — preserve as-is
            h=src;
        } else {
            // legacy markdown (imported old drafts) — still support via marked
            try{
                if(window.marked){
                    if(marked.use) { try{marked.use({mangle:false, headerIds:false});}catch(e){} }
                    h=marked.parse(src,{gfm:true,breaks:true,mangle:false,headerIds:false});
                }
            }catch(e){h=esc(src).replace(/\n/g,"<br>");}
        }
        // normalize already-HTML bodies: ensure tags get blog classes (works for both paths)
        return h
            .replace(/<blockquote(\s[^>]*)?>/g,'<blockquote class="border-l-4 rt-quote pl-6 py-2 my-8 text-2xl font-serif italic">')
            .replace(/<h1(\s[^>]*)?>/g,'<h1 class="rt-body-title text-5xl font-bold mt-10 mb-8 tracking-tight">')
            .replace(/<h2(\s[^>]*)?>/g,'<h2 class="rt-body-title text-4xl font-bold mt-16 mb-6 tracking-tight">')
            .replace(/<h3(\s[^>]*)?>/g,'<h3 class="rt-body-title text-3xl font-bold mt-12 mb-4 tracking-tight">')
            .replace(/<img /g,'<img loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.onerror=null;this.style.opacity=\'0.6\';this.alt+=\' (failed)\'" class="w-full object-cover rounded-2xl my-10" ');
    }

    function postHtml(){
        var s=state();
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
            "",
            '    <meta property="og:type" content="article">',
            '    <meta property="og:site_name" content="Random Thoughts">',
            '    <meta property="og:title" content="'+escAttr(s.title||"Untitled")+" | Random Thoughts Digest\">",
            '    <meta property="og:description" content="'+escAttr(s.description)+'">',
            '    <meta property="og:url" content="'+canonical+'">',
            '    <meta property="article:published_time" content="'+s.iso+'">',
            "",
            '    <meta name="twitter:card" content="summary">',
            '    <meta name="twitter:title" content="'+escAttr(s.title||"Untitled")+" | Random Thoughts Digest\">",
            '    <meta name="twitter:description" content="'+escAttr(s.description)+'">',
            '    <script src="https://cdn.tailwindcss.com"><\/script>',
            "",
            '    <link rel="preconnect" href="https://fonts.googleapis.com">',
            '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
            '    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">',
            "",
            '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">',
            '    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">',
            '    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"><\/script>',
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
            "        </header>","",
            body.split("\n").map(function(l){return "        "+l}).join("\n"),
            "",
            '        <footer class="mt-20 pt-10 border-t rt-foot text-sm">',
            "            <p>\uD55C\uC6B0\uACA9\uD569\uB2C8\uB2E4! \uAE00\uC744 \uB05D\uAE30\uBA74 \uB4E4\uC5EC\uC8FC\uC15C\uB2C8\uB2E4.</p>",
            "        </footer>","    </main>",
            "","    <div id='site-footer'></div>",
            "","    <div id='sc-player'></div>",
            "","    <script src='../assets/js/common.js'><\/script>",
            '    <script>try{hljs.highlightAll();}catch(e){}</script>',
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

    function mdFromState(){
        // now HTML mode — still front-matter + HTML body for unfinishedEdits (kept for compat, .html)
        var s=state();
        var fm=[
            "---",
            "title: "+s.title,
            "subtitle: "+s.subtitle,
            "category: "+s.category,
            "description: "+s.description,
            "date: "+s.date,
            "tags: "+s.tags.join(", "),
            "featured: "+(s.featured?"true":"false"),
            "slug: "+s.slug,
            "---",
            ""
        ].join("\n");
        return fm+s.body+"\n";
    }
    function draftHtmlFromState(){ return mdFromState(); } // alias for HTML mode
    function downloadText(filename,text,mime){
        var bl=new Blob([text],{type:mime||"text/plain;charset=utf-8"}),a=document.createElement("a");
        a.href=URL.createObjectURL(bl);a.download=filename;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(function(){URL.revokeObjectURL(a.href);},1500);
        toast("Downloaded "+filename);
    }
    function downloadMarkdown(){ // legacy — now saves HTML draft
        var s=state();downloadText(s.slug+".html",draftHtmlFromState(),"text/html;charset=utf-8");
    }
    function downloadDraftHtml(){ var s=state();downloadText(s.slug+"-draft.html",draftHtmlFromState(),"text/html;charset=utf-8"); }
    function downloadEntryJson(){
        var s=state();var entry=entryJs();
        // wrap as JSON for download
        var obj={id:s.slug,title:s.title,description:s.description,tags:s.tags,date:s.date,url:"posts/"+s.slug+".html",featured:s.featured,contributors:[AUTHOR]};
        downloadText(s.slug+".json",JSON.stringify(obj,null,2),"application/json;charset=utf-8");
    }
    function downloadAll(){
        // trigger two downloads: draft HTML + full post HTML
        downloadDraftHtml();
        setTimeout(function(){downloadPost();},400);
    }

    /* import helpers */
    function applyImported(data){
        var map={title:"title",subtitle:"subtitle",category:"category",date:"date",description:"description",tags:"tags",slug:"slug",featured:"featured",body:"body"};
        if(data.title!=null) el.title.value=data.title;
        if(data.subtitle!=null) el.subtitle.value=data.subtitle;
        if(data.category!=null) el.category.value=data.category;
        if(data.date!=null) el.date.value=data.date;
        if(data.description!=null) el.description.value=data.description;
        if(data.tags!=null) el.tags.value=Array.isArray(data.tags)?data.tags.join(", "):String(data.tags);
        if(data.slug!=null) el.slug.value=slugify(String(data.slug));
        if(data.featured!=null) el.featured.checked=!!data.featured&&String(data.featured)!=="false";
        if(data.body!=null) el.body.value=data.body;
        slugTouched=true;
        autosize(el.body);
        render();
        saveDraft();
        toast("Imported "+(data.slug||data.title||"draft"));
    }
    function htmlToMarkdown(html){
        var doc;try{doc=new DOMParser().parseFromString(html,"text/html");}catch(e){return html;}
        var main=doc.querySelector("main.article-body")||doc.querySelector("main")||doc.body;
        // remove header/footer
        var clone=main.cloneNode(true);
        var hdr=clone.querySelector("header"); if(hdr) hdr.remove();
        var ft=clone.querySelector("footer.rt-foot"); if(ft) ft.remove();
        // HTML_MODE: return raw HTML snippet, not markdown
        if(HTML_MODE){
            // clean up clone: ensure images have no blog-specific classes, keep src/alt
            var htmlSnippet = clone.innerHTML.trim();
            // strip script tags
            htmlSnippet = htmlSnippet.replace(/<script[\s\S]*?<\/script>/gi,"");
            // normalize: ensure no leftover site wrappers
            htmlSnippet = htmlSnippet.replace(/\s*class="[^"]*rt-[^"]*"/g,"");
            // add referrer handling via decorateBody later — just return snippet
            return cleanImportedBody(htmlSnippet);
        }
        function nodeToMd(node){
            var out="";
            node.childNodes.forEach(function(ch){
                if(ch.nodeType===3){ out+=ch.textContent; }
                else if(ch.nodeType===1){
                    var tag=ch.tagName.toLowerCase();
                    if(tag==="h1") out+="\n# "+ch.textContent.trim()+"\n\n";
                    else if(tag==="h2") out+="\n## "+ch.textContent.trim()+"\n\n";
                    else if(tag==="h3") out+="\n### "+ch.textContent.trim()+"\n\n";
                    else if(tag==="p"){
                        // handle inline — preserve images inside paragraphs (unsplash html fails otherwise)
                        var inner=""; ch.childNodes.forEach(function(c){
                            if(c.nodeType===3) inner+=c.textContent;
                            else if(c.nodeType===1){
                                var t=c.tagName.toLowerCase();
                                if(t==="strong"||t==="b") inner+="**"+c.textContent+"**";
                                else if(t==="em"||t==="i") inner+="*"+c.textContent+"*";
                                else if(t==="code") inner+="`"+c.textContent+"`";
                                else if(t==="a") inner+="["+c.textContent+"]("+c.getAttribute("href")+")";
                                else if(t==="img"){ var alt=c.getAttribute("alt")||""; var src=c.getAttribute("src")||""; inner+="!["+alt+"]("+src+")"; }
                                else if(t==="br") inner+="\n";
                                else inner+=c.textContent;
                            }
                        });
                        var trimmed=inner.trim();
                        // if paragraph was just an image, don't keep stray text artifacts like "classroom" alt-only
                        if(trimmed) out+=trimmed+"\n\n";
                    }
                    else if(tag==="blockquote"){
                        var txt=ch.textContent.trim().split("\n").map(function(l){return "> "+l}).join("\n");
                        out+=txt+"\n\n";
                    }
                    else if(tag==="ul"){
                        ch.querySelectorAll("li").forEach(function(li){ out+="- "+li.textContent.trim()+"\n"; });
                        out+="\n";
                    }
                    else if(tag==="ol"){
                        var i=1; ch.querySelectorAll("li").forEach(function(li){ out+=(i++)+". "+li.textContent.trim()+"\n"; });
                        out+="\n";
                    }
                    else if(tag==="pre"){
                        var code=ch.textContent; out+="```\n"+code+"\n```\n\n";
                    }
                    else if(tag==="img"){
                        var alt=ch.getAttribute("alt")||""; var src=ch.getAttribute("src")||""; out+="!["+alt+"]("+src+")\n\n";
                    }
                    else if(tag==="a"){
                        out+="["+ch.textContent+"]("+ch.getAttribute("href")+")";
                    }
                    else out+=nodeToMd(ch);
                }
            });
            return out;
        }
        var md=nodeToMd(clone).replace(/\n{3,}/g,"\n\n").trim();
        md=cleanImportedBody(md);
        return md;
    }
    function cleanImportedBody(md){
        if(!md) return md;
        // use smart dedent + heading promotion for centered pasted text that confuses markdown
        try{ if(typeof dedentMd==="function") md=dedentMd(md); }catch(e){}
        try{ if(typeof smartHeadings==="function") md=smartHeadings(md); }catch(e){}
        // strip site footers that get auto-appended on export — prevents duplication on re-import
        md=md.replace(/^\s*한우격합니다![^\n]*$/gm,"");
        md=md.replace(/^\s*훌륭합니다![^\n]*$/gm,"");
        // also strip english duplicate footer
        md=md.replace(/^\s*Great![^\n]*$/gim,"");
        md=md.replace(/\n{3,}/g,"\n\n").trim();
        return md;
    }
    function parseHtmlImport(text){
        var doc; try{doc=new DOMParser().parseFromString(text,"text/html");}catch(e){return {body:text};}
        var getMeta=function(name,prop){ var m=prop?doc.querySelector('meta[property="'+name+'"]'):doc.querySelector('meta[name="'+name+'"]'); return m?m.getAttribute("content"):"";};
        var titleEl=doc.querySelector("h1.rt-body-title")||doc.querySelector("h1");
        var title=titleEl?titleEl.textContent.trim():"";
        if(!title){ var t=doc.querySelector("title"); if(t) title=t.textContent.split(" | ")[0].trim(); }
        var subtitleEl=doc.querySelector(".rt-body-sub"); var subtitle=subtitleEl?subtitleEl.textContent.trim():"";
        var catEl=doc.querySelector(".rt-body-cat"); var category=catEl?catEl.textContent.trim():"";
        var desc=getMeta("description")||getMeta("og:description",true)||"";
        var iso=getMeta("article:published_time",true)||getMeta("og:published_time",true)||"";
        var date="";
        if(iso){ try{var d=new Date(iso); if(!isNaN(d)) date=d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}catch(e){} }
        if(!date) date=todayDisplay();
        // slug from canonical or filename
        var slug="";
        var can=doc.querySelector('link[rel="canonical"]'); if(can){ var href=can.getAttribute("href")||""; var m=/\/posts\/([^\/\.]+)\.html/.exec(href); if(m) slug=m[1]; }
        var body=htmlToMarkdown(text);
        return {title:title,subtitle:subtitle,category:category,description:desc,slug:slug,date:date,body:body};
    }
    function parseMdImport(text){
        var meta={}, body=text;
        if(text.trim().startsWith("---")){
            var lines=text.split("\n"); var end=-1;
            for(var i=1;i<lines.length;i++){ if(lines[i].trim()==="---"){ end=i; break; } }
            if(end!==-1){
                for(var j=1;j<end;j++){
                    var line=lines[j]; var idx=line.indexOf(":");
                    if(idx===-1) continue;
                    var k=line.slice(0,idx).trim().toLowerCase();
                    var v=line.slice(idx+1).trim();
                    meta[k]=v;
                }
                body=lines.slice(end+1).join("\n").trimStart();
                body=cleanImportedBody(body);
            } else {
                // no frontmatter — still strip footers if pasted raw html-like text
                body=cleanImportedBody(body);
            }
        } else {
            body=cleanImportedBody(body);
        }
        return {
            title:meta.title||"", subtitle:meta.subtitle||"", category:meta.category||"", description:meta.description||"",
            date:meta.date||"", tags:meta.tags||"", slug:meta.slug||"",
            featured:meta.featured, body:body
        };
    }

    function wordsOf(t){t=String(t||"").trim();return t?t.split(/\s+/).length:0;}

    function refreshOutline(){
        if(!el.outline) return;
        var body=el.body.value||"";
        var items=[];
        if(HTML_MODE && /<\s*h[1-3]/i.test(body)){
            // HTML mode — parse <h1>, <h2>, <h3> tags
            var re=/<\s*h([1-3])[^>]*>(.*?)<\/\s*h\1\s*>/gi, m;
            while((m=re.exec(body))!==null){
                var txt=m[2].replace(/<[^>]+>/g,"").trim();
                if(txt) items.push({lvl:parseInt(m[1],10), text:txt});
            }
        } else {
            var lines=body.split("\n");
            lines.forEach(function(l){
                var m=/^(#{1,3})\s+(.+)$/.exec(l.trim());
                if(m) items.push({lvl:m[1].length,text:m[2].trim()});
            });
        }
        if(el.outlineCount) el.outlineCount.textContent=items.length?items.length+"":"";
        if(!items.length){
            el.outline.innerHTML='<span class="outline-empty">No headings yet</span>';
            return;
        }
        var html="";
        items.forEach(function(it){
            html+='<button type="button" class="outline-item lvl-'+it.lvl+'" title="'+escAttr(it.text)+'"><span>'+esc(it.text)+'</span></button>';
        });
        el.outline.innerHTML=html;
    }

    function refreshMeta(){
        var s=state();
        var wd=wordsOf(s.body),chars=s.body.length,mins=Math.max(1,Math.round(wd/180));
        el.docTitle.textContent=s.title;
        el.wordcount.textContent=wd+" words";
        if(el.statusChars) el.statusChars.textContent=chars+"";
        if(el.statusRead) el.statusRead.textContent="~"+mins+" min";
        if(el.slugPreview) el.slugPreview.textContent=s.slug;
        var sbSlug=document.getElementById("sb-slug");
        if(sbSlug) sbSlug.textContent=s.slug;
        var sbWc=document.getElementById("sb-wordcount");
        if(sbWc) sbWc.textContent=wd+" words";
        var inWords=document.getElementById("in-words");
        if(inWords) inWords.textContent=wd+"";
        var inSlug=document.getElementById("in-slug");
        if(inSlug) inSlug.textContent=s.slug;
        var showEmpty=(!s.title&&!s.body);
        el.frame.style.display=showEmpty?"none":"";
        el.previewEmpty.style.display=showEmpty?"flex":"none";
        refreshOutline();
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
    function schedulePreview(){clearTimeout(_pv);_pv=setTimeout(function(){refreshMeta();refreshPreview();},380);}

    var _save=null;
    function fields(){return ["title","subtitle","category","date","description","tags","slug"];}
    function saveDraft(){
        var d={};fields().forEach(function(k){d[k]=el[k].value;});
        d.featured=el.featured.checked;d.body=el.body.value;d._saved=Date.now();
        try{localStorage.setItem(DRAFT_KEY,JSON.stringify(d));}catch(e){}
        pillStatus(true);
        // keep browser library in sync so library can open the saved editing document
        try{
            // don't duplicate empty drafts
            var hasAny = d.title||d.body||d.slug;
            if(hasAny) upsertLibrary({ id: docId({slug: d.slug||slugify(d.title||"draft")}), title:d.title, subtitle:d.subtitle, category:d.category, description:d.description, tags:d.tags, slug:d.slug, featured:d.featured, body:d.body, date:d.date, _saved:d._saved, source:"browser" }, "browser");
        }catch(e){}
    }
    function loadDraft(){try{var r=localStorage.getItem(DRAFT_KEY);return r?JSON.parse(r):null;}catch(e){return null;}}
    function restoreDraft(){var d=loadDraft();if(!d)return false;fields().forEach(function(k){if(d[k]!=null)el[k].value=d[k];});if(d.featured)el.featured.checked=true;if(d.body)el.body.value=d.body;return true;}
    function clearDraft(){try{localStorage.removeItem(DRAFT_KEY);}catch(e){}pillStatus(false);}
    function pillStatus(ok){
        el.pill.classList.toggle("is-saved",ok);
        el.pillLabel.textContent=ok?"Saved "+timeNow():"Unsaved";
        var ins=document.getElementById("in-status");
        if(ins) ins.textContent=ok?"Saved":"Unsaved";
    }
    function isAutosaveOn(){ try{return localStorage.getItem(AUTOSAVE_KEY)==="1";}catch(e){return false;} }
    function setAutosave(on){
        try{localStorage.setItem(AUTOSAVE_KEY,on?"1":"0");}catch(e){}
        var cb=document.getElementById("toggle-autosave");
        if(cb) cb.checked=!!on;
        // reflect in hidden menu checkbox title
        if(on) toast("Autosave on — edits save automatically");
        else toast("Autosave off — use Save manually");
    }
    function scheduleSave(){
        // when autosave is off, just mark unsaved, don't write — user saves manually and edits stack on same file
        clearTimeout(_save);
        pillStatus(false);
        if(!isAutosaveOn()) return;
        _save=setTimeout(saveDraft,700);
    }
    // library — browser saved + custom, with delete
    var libTab="browser", libQuery="";
    function getLibrary(){ try{var v=localStorage.getItem(LIB_KEY); var a=v?JSON.parse(v):[]; return Array.isArray(a)?a:[];}catch(e){return [];} }
    function setLibrary(arr){ try{localStorage.setItem(LIB_KEY,JSON.stringify(arr));}catch(e){} }
    function docId(d){ return (d.slug&&String(d.slug).trim())||d.id||("doc-"+(d._saved||Date.now())); }
    function upsertLibrary(doc, source){
        var lib=getLibrary();
        var s=state();
        // build doc from current editor if not supplied
        var base=doc||{
            id:docId(s), title:s.title, subtitle:s.subtitle, category:s.category,
            description:s.description, tags:s.tags.join(", "), slug:s.slug,
            featured:s.featured, body:s.body, date:s.date
        };
        base.source=source||base.source||"browser";
        base._saved=Date.now();
        base.id=docId(base);
        // normalize slug
        if(base.slug) base.slug=slugify(base.slug);
        var idx=-1;
        for(var i=0;i<lib.length;i++){ if((lib[i].id&&lib[i].id===base.id)||(lib[i].slug&&base.slug&&lib[i].slug===base.slug)){ idx=i; break; } }
        if(idx!==-1) lib[idx]=Object.assign(lib[idx],base);
        else lib.unshift(base);
        // keep cap 50
        if(lib.length>50) lib=lib.slice(0,50);
        setLibrary(lib);
        return lib;
    }
    function seedCustomIfEmpty(){
        var lib=getLibrary();
        var hasCustom=lib.some(function(d){return d.source==="custom";});
        if(hasCustom) return;
        var seeds=[
            {id:"custom-hello", title:"Hello — Custom Template", subtitle:"A minimal starter with quote & list", category:"Notes", description:"Custom template to kickstart a new essay.", tags:"Tech, Life", slug:"hello-template", featured:false, body:"<h2>Intro</h2>\n<p>Start with a hook. This is a <strong>custom</strong> template.</p>\n<blockquote>A pull quote to set the tone.</blockquote>\n<ul><li>First point</li><li>Second point</li></ul>\n<pre><code>code goes here</code></pre>\n", date:todayDisplay(), source:"custom", _saved:Date.now()-2000},
            {id:"custom-photo", title:"Photo Essay — Custom", subtitle:"Image-led story", category:"Travel", description:"Custom layout for photo-heavy posts.", tags:"Travel", slug:"photo-essay", featured:true, body:"<h2>A moment</h2>\n<img src=\"https://picsum.photos/seed/scene/800/500\" alt=\"A scene\">\n<p>Write your story around the image.</p>\n", date:todayDisplay(), source:"custom", _saved:Date.now()-1000}
        ];
        lib=seeds.concat(lib);
        setLibrary(lib);
    }
    function deleteDoc(id, sourceFilter){
        var lib=getLibrary();
        var before=lib.length;
        if(sourceFilter){
            lib=lib.filter(function(d){ return !( (d.id===id||d.slug===id) && d.source===sourceFilter); });
            // fallback if not matched by source
            if(lib.length===before) lib=lib.filter(function(d){return !(d.id===id||d.slug===id);});
        } else {
            lib=lib.filter(function(d){return !(d.id===id||d.slug===id);});
        }
        setLibrary(lib);
        renderLibrary();
        toast("Deleted");
    }
    function clearTabDocs(tab){
        if(!confirm("Delete all \""+tab+"\" drafts?")) return;
        var lib=getLibrary();
        if(tab==="all") lib=[];
        else lib=lib.filter(function(d){return d.source!==tab;});
        setLibrary(lib);
        renderLibrary();
        toast("Cleared "+tab);
    }
    function openDoc(id){
        var lib=getLibrary();
        var doc=null;
        for(var i=0;i<lib.length;i++){ if(lib[i].id===id||lib[i].slug===id){ doc=lib[i]; break; } }
        if(!doc) return toast("Not found");
        closeLibrary();
        // fill editor
        var data={
            title:doc.title, subtitle:doc.subtitle, category:doc.category, description:doc.description,
            tags:doc.tags, slug:doc.slug, featured:doc.featured, body:doc.body, date:doc.date
        };
        applyImported(data);
        toast("Opened "+(doc.title||doc.slug));
    }

    function autosize(t){t.style.height="auto";t.style.height=t.scrollHeight+"px";}

    function renderLibrary(){
        if(!el.libList) return;
        var lib=getLibrary();
        var q=(libQuery||"").toLowerCase();
        var filtered=lib.filter(function(d){
            if(libTab!=="all" && d.source!==libTab) return false;
            if(!q) return true;
            var hay=[d.title,d.subtitle,d.category,d.description,d.tags,d.slug,d.body].join(" ").toLowerCase();
            return hay.indexOf(q)!==-1;
        });
        var countEl=document.getElementById("lib-count");
        if(countEl) countEl.textContent=filtered.length+" doc"+(filtered.length!==1?"s":"")+" · "+libTab;
        if(!filtered.length){
            var emptyMsg = libTab==="custom" ? "No custom docs — click Save current and it will appear as Browser saved. Use Import to bring your own, then Save current as custom." : (q ? "No matches for \""+esc(libQuery)+"\"" : "No drafts yet — write something and hit Save.");
            el.libList.innerHTML='<div class="lib-empty">'+emptyMsg+'<br><br><button class="tbtn tbtn--primary" id="lib-empty-save"><i class="fa-solid fa-plus"></i> Save current draft</button></div>';
            var es=document.getElementById("lib-empty-save");
            if(es) es.addEventListener("click",function(){ upsertLibrary(null, libTab==="custom"?"custom":"browser"); renderLibrary(); toast("Saved to "+libTab); });
            return;
        }
        var html="";
        filtered.forEach(function(d){
            var title=esc(d.title||"Untitled");
            var sub=esc(d.subtitle||d.description||"No description");
            var slug=esc(d.slug||d.id||"");
            var badge = d.source==="custom" ? '<span class="lib-badge lib-badge--custom">custom</span>' : '<span class="lib-badge lib-badge--browser">browser</span>';
            var date=esc(d.date||"");
            var tagsArr = String(d.tags||"").split(",").map(function(t){return t.trim();}).filter(Boolean).slice(0,3);
            var tagsHtml = tagsArr.length ? tagsArr.map(function(t){return '<b>#'+esc(t)+'</b>';}).join(" ") : '<b>—</b>';
            var preview=(d.body||"").slice(0,80).replace(/\n/g," ");
            html+='<div class="lib-item '+(d.source==="custom"?'lib-item--custom':'')+'" data-id="'+escAttr(d.id||d.slug)+'">'
                +'<div class="lib-item-top"><span class="lib-item-title">'+title+'</span>'+badge+'</div>'
                +'<div class="lib-item-sub">'+sub+'</div>'
                +'<div class="lib-item-meta"><span>'+(date||"—")+'</span><span>·</span><b>'+slug+'.html</b><span>·</span>'+tagsHtml+'</div>'
                +'<div class="lib-item-actions"><button class="tbtn tbtn--primary lib-open" data-id="'+escAttr(d.id||d.slug)+'"><i class="fa-solid fa-arrow-right-to-bracket"></i> Open</button>'
                +'<button class="tbtn tbtn--ghost lib-del" data-id="'+escAttr(d.id||d.slug)+'" title="Delete"><i class="fa-solid fa-trash"></i></button></div>'
                +'</div>';
        });
        el.libList.innerHTML=html;
        Array.prototype.forEach.call(el.libList.querySelectorAll(".lib-open"),function(b){
            b.addEventListener("click",function(e){ e.stopPropagation(); openDoc(b.getAttribute("data-id")); });
        });
        Array.prototype.forEach.call(el.libList.querySelectorAll(".lib-del"),function(b){
            b.addEventListener("click",function(e){ e.stopPropagation(); if(confirm("Delete this draft?")) deleteDoc(b.getAttribute("data-id")); });
        });
        Array.prototype.forEach.call(el.libList.querySelectorAll(".lib-item"),function(card){
            card.addEventListener("click",function(){ openDoc(card.getAttribute("data-id")); });
        });
    }
    function openLibrary(){
        if(!el.library) return;
        seedCustomIfEmpty();
        // sync current draft into library silently so Browser saved always has latest?
        // don't auto-sync to avoid spam; user uses Save current
        renderLibrary();
        el.library.classList.add("open");
    }
    function closeLibrary(){ if(el.library) el.library.classList.remove("open"); }
    // wire library
    (function(){
        var btn=document.getElementById("btn-library");
        if(btn) btn.addEventListener("click",function(){ openLibrary(); });
        var closeBtns=document.querySelectorAll("[data-libclose]");
        Array.prototype.forEach.call(closeBtns,function(b){ b.addEventListener("click",closeLibrary); });
        var tabs=document.querySelectorAll("[data-libtab]");
        Array.prototype.forEach.call(tabs,function(b){
            b.addEventListener("click",function(){
                libTab=b.getAttribute("data-libtab")||"browser";
                tabs.forEach(function(t){ t.classList.toggle("active",t===b); t.setAttribute("aria-selected",t===b?"true":"false"); });
                renderLibrary();
            });
        });
        var search=document.getElementById("lib-search");
        if(search) search.addEventListener("input",function(){ libQuery=search.value; renderLibrary(); });
        var saveCur=document.getElementById("lib-save-current");
        if(saveCur) saveCur.addEventListener("click",function(){
            var src = libTab==="custom" ? "custom" : "browser";
            upsertLibrary(null, src);
            renderLibrary();
            toast("Saved to "+src);
        });
        var clearBtn=document.getElementById("lib-clear");
        if(clearBtn) clearBtn.addEventListener("click",function(){ clearTabDocs(libTab); });
        // also close on backdrop click already handled via data attrs above
    })();
    fields().forEach(function(k){el[k].addEventListener("input",function(){if(k==="title")slugTouched=false;scheduleMeta();schedulePreview();scheduleSave();});});
    el.slug.addEventListener("input",function(){slugTouched=true;el.slug.value=slugify(el.slug.value);schedulePreview();scheduleSave();refreshMeta();});
    el.featured.addEventListener("change",scheduleSave);
    el.body.addEventListener("input",function(){autosize(el.body);schedulePreview();scheduleSave();});
    el.category.addEventListener("input",function(){refreshMeta();});

    function scheduleMeta(){refreshMeta();}

    function render(){refreshMeta();refreshPreview();}
    // unfinishedEdits — gitignored folder for browser saves
    var UNFINISHED_DIR="unfinishedEdits";
    function saveToUnfinishedEdits(){
        saveDraft(); // keep browser + library
        var s=state();
        var md=draftHtmlFromState();
        // try File System Access API if user previously picked a dir (via browser picker)
        // we also store a handle if available; fallback is normal download
        // hint filename: unfinishedEdits/<slug>.html (user moves if needed)
        // show instructions: this folder is gitignored
        if(window.showSaveFilePicker){
            // optional modern save — suggest unfinishedEdits folder name
            var opts={suggestedName: s.slug+".html", types:[{description:"HTML", accept:{"text/html":[".html"]}}]};
            showSaveFilePicker(opts).then(function(handle){
                return handle.createWritable().then(function(w){ return w.write(md).then(function(){ return w.close(); }).then(function(){ toast("Saved to "+UNFINISHED_DIR+"/"+s.slug+".html"); }); });
            }).catch(function(err){
                // user cancelled or not allowed — fallback to download
                if(err && err.name==="AbortError") return;
                downloadText(s.slug+".html", md, "text/html;charset=utf-8");
                toast("Downloaded — move to "+UNFINISHED_DIR+"/ (gitignored)");
            });
        } else {
            downloadText(s.slug+".html", md, "text/html;charset=utf-8");
            toast("Downloaded — move to "+UNFINISHED_DIR+"/ (gitignored)");
        }
    }

    function downloadPost(){
        var s=state();downloadText(s.filename,postHtml(),"text/html;charset=utf-8");
    }
    function closeAllMenus(){
        [el.exportMenu,el.importMenu,el.saveMenu,el.advMenu].forEach(function(m){if(m) m.classList.remove("open");});
    }
    function setupMenus(){
        var btnExport=document.getElementById("btn-export");
        var btnImport=document.getElementById("btn-import");
        var btnSaveCaret=document.getElementById("btn-save-caret");
        var btnAdv=document.getElementById("btn-adv");
        if(btnExport&&el.exportMenu) btnExport.addEventListener("click",function(e){e.stopPropagation();var o=el.exportMenu.classList.contains("open");closeAllMenus();if(!o)el.exportMenu.classList.add("open");});
        if(btnImport&&el.importMenu) btnImport.addEventListener("click",function(e){e.stopPropagation();var o=el.importMenu.classList.contains("open");closeAllMenus();if(!o)el.importMenu.classList.add("open");});
        if(btnSaveCaret&&el.saveMenu) btnSaveCaret.addEventListener("click",function(e){e.stopPropagation();var o=el.saveMenu.classList.contains("open");closeAllMenus();if(!o)el.saveMenu.classList.add("open");});
        if(btnAdv&&el.advMenu) btnAdv.addEventListener("click",function(e){e.stopPropagation();var o=el.advMenu.classList.contains("open");closeAllMenus();if(!o)el.advMenu.classList.add("open");});
        document.addEventListener("click",function(e){if(!e.target.closest(".menu-wrap")) closeAllMenus();});
        // autosave toggle in hidden menu
        var tog=document.getElementById("toggle-autosave");
        if(tog){
            tog.checked=isAutosaveOn();
            tog.addEventListener("change",function(){ setAutosave(tog.checked); });
        }
        // Adv tools (clean top bar overflow)
        var advBtns=document.querySelectorAll("#adv-menu [data-adv]");
        Array.prototype.forEach.call(advBtns,function(b){
            b.addEventListener("click",function(){
                closeAllMenus();
                var act=b.getAttribute("data-adv");
                if(act==="import-html" && el.importHtmlInput) el.importHtmlInput.click();
                else if(act==="import-md" && el.importMdInput) el.importMdInput.click();
                else if(act==="focus"){
                    var tf=document.getElementById("btn-focus-toolbar");
                    if(tf) tf.click();
                    else { var ze=document.getElementById("zen-exit"); if(ze) ze.click(); }
                }
                else if(act==="commands"){
                    var pc=document.getElementById("btn-palette");
                    if(pc) pc.click(); else if(typeof togglePalette==="function") togglePalette();
                }
                else if(act==="help"){
                    var hb=document.getElementById("btn-help");
                    if(hb) hb.click();
                    else if(typeof setHelp==="function") setHelp(true);
                }
            });
        });
    }
    setupMenus();
    Array.prototype.forEach.call(el.exportMenu.querySelectorAll("button[data-act]"),function(b){
        b.addEventListener("click",function(){
            var act=b.getAttribute("data-act");
            if(act==="html")copyText(postHtml(),"HTML copied");
            else if(act==="entry")copyText(entryJs(),"Entry copied");
            else downloadPost();
            el.exportMenu.classList.remove("open");
        });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".inspector [data-act]"),function(b){
        b.addEventListener("click",function(){
            var act=b.getAttribute("data-act");
            if(act==="html")copyText(postHtml(),"HTML copied");
            else if(act==="entry")copyText(entryJs(),"Entry copied");
            else downloadPost();
        });
    });
    // import menu
    if(el.importMenu){
        Array.prototype.forEach.call(el.importMenu.querySelectorAll("button[data-import]"),function(b){
            b.addEventListener("click",function(){
                var kind=b.getAttribute("data-import");
                closeAllMenus();
                if(kind==="html"&&el.importHtmlInput) el.importHtmlInput.click();
                else if(kind==="md"&&el.importMdInput) el.importMdInput.click();
            });
        });
    }
    // save menu (multi-file)
    if(el.saveMenu){
        Array.prototype.forEach.call(el.saveMenu.querySelectorAll("button[data-save]"),function(b){
            b.addEventListener("click",function(){
                var act=b.getAttribute("data-save");
                closeAllMenus();
                if(act==="draft"){saveDraft();toast("Saved");}
                else if(act==="unfinished") saveToUnfinishedEdits();
                else if(act==="md") downloadDraftHtml();
                else if(act==="html") downloadPost();
                else if(act==="draft-html") downloadDraftHtml();
                else if(act==="entry") downloadEntryJson();
                else if(act==="all") downloadAll();
            });
        });
    }

    // file input handlers
    if(el.importHtmlInput){
        el.importHtmlInput.addEventListener("change",function(e){
            var f=e.target.files&&e.target.files[0]; if(!f) return;
            var r=new FileReader();
            r.onload=function(ev){ try{var data=parseHtmlImport(ev.target.result); applyImported(data);}catch(err){toast("HTML import failed");} };
            r.readAsText(f); e.target.value="";
        });
    }
    if(el.importMdInput){
        el.importMdInput.addEventListener("change",function(e){
            var f=e.target.files&&e.target.files[0]; if(!f) return;
            var r=new FileReader();
            r.onload=function(ev){ try{var data=parseMdImport(ev.target.result); applyImported(data);}catch(err){toast("Markdown import failed");} };
            r.readAsText(f); e.target.value="";
        });
    }
    // drag & drop anywhere
    document.addEventListener("dragover",function(e){e.preventDefault();});
    document.addEventListener("drop",function(e){
        e.preventDefault();
        var f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; if(!f) return;
        var name=f.name.toLowerCase();
        var r=new FileReader();
        if(name.endsWith(".html")||name.endsWith(".htm")){
            r.onload=function(ev){ try{applyImported(parseHtmlImport(ev.target.result));}catch(err){toast("Import failed");}};
        } else {
            r.onload=function(ev){ try{applyImported(parseMdImport(ev.target.result));}catch(err){toast("Import failed");}};
        }
        r.readAsText(f);
    });

    document.getElementById("btn-save").addEventListener("click",function(){saveDraft();toast("Saved");});
    document.getElementById("btn-new").addEventListener("click",function(){
        if(!confirm("Start a new draft? This clears the current draft."))return;
        clearDraft();fields().forEach(function(k){el[k].value="";});
        el.featured.checked=false;slugTouched=false;el.date.value=todayDisplay();el.body.value="";autosize(el.body);
        render();toast("New draft");
    });
    document.getElementById("btn-refresh").addEventListener("click",refreshPreview);

    var PV_KEY="eb-preview",pvSet={desktop:"pv-desktop",tablet:"pv-tablet",phone:"pv-phone"};
    function setPreviewWidth(w){
        el.previewStage.setAttribute("data-width",w);
        for(var k in pvSet)document.getElementById(pvSet[k]).classList.toggle("active",k===w);
        try{localStorage.setItem(PV_KEY,w);}catch(e){}
    }
    for(var k in pvSet)(function(k){
        document.getElementById(pvSet[k]).addEventListener("click",function(){setPreviewWidth(k);});
    })(k);
    setPreviewWidth(localStorage.getItem(PV_KEY)==="tablet"||localStorage.getItem(PV_KEY)==="phone"?localStorage.getItem(PV_KEY):"desktop");

    var detailsOpen=localStorage.getItem(DETAILS_KEY)==="1";
    el.details.classList.toggle("open",detailsOpen);
    el.btnDetailsLabel.textContent=detailsOpen?"Hide details":"Details";
    el.btnDetails.addEventListener("click",function(){
        var open=!el.details.classList.contains("open");
        el.details.classList.toggle("open",open);el.btnDetailsLabel.textContent=open?"Hide details":"Details";
        try{localStorage.setItem(DETAILS_KEY,open?"1":"0");}catch(e){}
    });

    var helpOpen=false;
    function setHelp(open){
        helpOpen=!!open;
        el.help.classList.toggle("open",helpOpen);
    }
    el.btnHelp.addEventListener("click",function(){setHelp(true);});
    Array.prototype.forEach.call(el.help.querySelectorAll("[data-close]"),function(b){
        b.addEventListener("click",function(){setHelp(false);});
    });
    document.addEventListener("keydown",function(e){if(e.key==="Escape"){setHelp(false);closePalette();closeAllMenus();closeLibrary();}});

    function insertAtBody(before,after,placeholder){
        var t=el.body,s=t.selectionStart,e=t.selectionEnd,v=t.value;
        var sel=v.slice(s,e)||placeholder||"";
        t.value=v.slice(0,s)+before+sel+after+v.slice(e);
        t.focus();t.setSelectionRange(s+before.length,s+before.length+sel.length);
        autosize(t);schedulePreview();scheduleSave();refreshMeta();
    }
    function insertLine(prefix){
        var t=el.body,s=t.selectionStart,v=t.value;
        var ls=v.lastIndexOf("\n",s-1)+1;
        t.value=v.slice(0,ls)+prefix+v.slice(ls);
        t.focus();t.setSelectionRange(ls+prefix.length,ls+prefix.length);
        autosize(t);schedulePreview();scheduleSave();refreshMeta();
    }
    var commands=[
        {id:"h2",g:"Insert",ic:"fa-solid fa-heading",label:"Heading 2",desc:"<h2>",match:["head","title"],run:function(){ if(HTML_MODE){ insertAtBody("<h2>","</h2>","heading"); } else insertLine("## "); }},
        {id:"h3",g:"Insert",ic:"fa-solid fa-heading",label:"Heading 3",desc:"<h3>",match:["head"],run:function(){ if(HTML_MODE){ insertAtBody("<h3>","</h3>","heading"); } else insertLine("### "); }},
        {id:"quote",g:"Insert",ic:"fa-solid fa-quote-left",label:"Quote",desc:"<blockquote>",match:["blockquote"],run:function(){ if(HTML_MODE){ insertAtBody('<blockquote class="border-l-4 rt-quote">',"</blockquote>","pull quote"); } else insertLine("> "); }},
        {id:"list",g:"Insert",ic:"fa-solid fa-list-ul",label:"List",desc:"<ul>",match:["bullet","ul"],run:function(){ if(HTML_MODE){ insertAtBody("<ul>\n  <li>","</li>\n</ul>","item"); } else insertLine("- "); }},
        {id:"bold",g:"Insert",ic:"fa-solid fa-bold",label:"Bold",desc:"<strong>",run:function(){ if(HTML_MODE){ insertAtBody("<strong>","</strong>","bold"); } else insertAtBody("**","**","bold"); }},
        {id:"italic",g:"Insert",ic:"fa-solid fa-italic",label:"Italic",desc:"<em>",run:function(){ if(HTML_MODE){ insertAtBody("<em>","</em>","italic"); } else insertAtBody("*","*","italic"); }},
        {id:"link",g:"Insert",ic:"fa-solid fa-link",label:"Link",desc:"<a>",run:function(){ if(HTML_MODE){ insertAtBody('<a href="https://example.com">','</a>',"text"); } else insertAtBody("[","](url)","text"); }},
        {id:"image",g:"Insert",ic:"fa-regular fa-image",label:"Image",desc:"<img>",run:function(){ if(HTML_MODE){ insertAtBody('<img src="','" alt="alt">',"https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1400&auto=format&fit=crop"); } else insertAtBody("![","](url)","alt"); }},
        {id:"code",g:"Insert",ic:"fa-solid fa-code",label:"Inline code",desc:"<code>",run:function(){ if(HTML_MODE){ insertAtBody("<code>","</code>","code"); } else insertAtBody("`","`","code"); }},
        {id:"codeblock",g:"Insert",ic:"fa-solid fa-terminal",label:"Code block",desc:"<pre><code>",match:["fence"],run:function(){ if(HTML_MODE){ insertAtBody("<pre><code>","\n</code></pre>","code"); } else insertAtBody("```\n","\n```","code"); }},
        {id:"theme",g:"Actions",ic:"fa-solid fa-circle-half-stroke",label:"Toggle theme",desc:"dark · light",match:["dark","light"],run:function(){applyTheme(document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark");}},
        {id:"help",g:"Actions",ic:"fa-solid fa-book-open",label:"Reference",desc:"cheat sheet",match:["md","cheatsheet"],run:function(){setHelp(true);}},
        {id:"details",g:"Actions",ic:"fa-solid fa-sliders",label:"Toggle details",desc:"post meta",run:function(){el.btnDetails.click();}},
        {id:"new",g:"Actions",ic:"fa-solid fa-plus",label:"New draft",desc:"start fresh",run:function(){document.getElementById("btn-new").click();}},
        {id:"library",g:"Actions",ic:"fa-solid fa-layer-group",label:"Library",desc:"open saved drafts",match:["open","browser","custom"],run:function(){openLibrary();}},
        {id:"save",g:"Actions",ic:"fa-regular fa-floppy-disk",label:"Save draft",desc:"⌘S",run:function(){saveDraft();toast("Saved");}},
        {id:"savemd",g:"Actions",ic:"fa-brands fa-markdown",label:"Download Markdown",desc:"save .md",run:function(){downloadMarkdown();}},
        {id:"savehtml",g:"Actions",ic:"fa-solid fa-code",label:"Download HTML",desc:"save .html",run:function(){downloadPost();}},
        {id:"saveall",g:"Actions",ic:"fa-solid fa-download",label:"Download all files",desc:"md + html",run:function(){downloadAll();}},
        {id:"importhtml",g:"Actions",ic:"fa-solid fa-file-import",label:"Import HTML",desc:"load .html",run:function(){el.importHtmlInput.click();}},
        {id:"importmd",g:"Actions",ic:"fa-brands fa-markdown",label:"Import Markdown",desc:"load .md",run:function(){el.importMdInput.click();}},
        {id:"refresh",g:"Actions",ic:"fa-solid fa-rotate",label:"Refresh preview",desc:"rebuild",run:function(){refreshPreview();}},
        {id:"copyhtml",g:"Actions",ic:"fa-solid fa-code",label:"Copy post HTML",desc:"export",run:function(){copyText(postHtml(),"HTML copied");}},
        {id:"copyentry",g:"Actions",ic:"fa-solid fa-list",label:"Copy index entry",desc:"export",run:function(){copyText(entryJs(),"Entry copied");}},
        {id:"download",g:"Actions",ic:"fa-solid fa-download",label:"Download post",desc:"export",run:function(){downloadPost();}},
        {id:"blog",g:"Actions",ic:"fa-solid fa-arrow-up-right-from-square",label:"Open blog",desc:"docs",run:function(){window.location.href="../docs/index.html";}}
    ];
    var commandsById={};
    commands.forEach(function(c){commandsById[c.id]=c;});

    Array.prototype.forEach.call(document.querySelectorAll(".toolbar-inline [data-cmd]"),function(btn){
        var c=commandsById[btn.getAttribute("data-cmd")];
        if(c)btn.addEventListener("click",function(){c.run();});
    });

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
        el.paletteList.innerHTML=html||'<div class="palette-empty">No results — try “heading” or “save”</div>';
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

    var savedSplit=parseFloat(localStorage.getItem(SPLIT_KEY));
    if(!isNaN(savedSplit))el.main.style.setProperty("--split",Math.max(30,Math.min(68,savedSplit))+"%");
    el.divider.addEventListener("pointerdown",function(e){
        if(e.button!==0&&e.pointerType==="mouse")return;
        e.preventDefault();el.divider.classList.add("hot");el.divider.setPointerCapture(e.pointerId);
        var pct=58;
        var startPct=parseFloat(getComputedStyle(el.main).getPropertyValue("--split"))||58;
        pct=startPct;
        function move(ev){var r=el.main.getBoundingClientRect();pct=((ev.clientX-r.left)/r.width)*100;pct=Math.max(30,Math.min(68,pct));el.main.style.setProperty("--split",pct+"%");}
        function up(){
            el.divider.classList.remove("hot");
            el.divider.removeEventListener("pointermove",move);
            el.divider.removeEventListener("pointerup",up);
            el.divider.removeEventListener("pointercancel",up);
            try{localStorage.setItem(SPLIT_KEY,String(Math.round(pct)));}catch(err){}
        }
        el.divider.addEventListener("pointermove",move);
        el.divider.addEventListener("pointerup",up);
        el.divider.addEventListener("pointercancel",up);
    });
    el.divider.addEventListener("dblclick",function(){el.main.style.setProperty("--split","58%");try{localStorage.setItem(SPLIT_KEY,"58");}catch(e){}});

    /* view modes — focused by default */
    var viewBtns={write:document.getElementById("seg-write"),both:document.getElementById("seg-both"),preview:document.getElementById("seg-preview")};
    function setView(mode){
        el.workspace.classList.remove("mode-write","mode-both","mode-preview");
        if(mode==="write") el.workspace.classList.add("mode-write");
        else if(mode==="preview") el.workspace.classList.add("mode-preview");
        else el.workspace.classList.add("mode-both");
        Object.keys(viewBtns).forEach(function(k){ if(viewBtns[k]){viewBtns[k].classList.toggle("active",k===mode); viewBtns[k].setAttribute("aria-selected",k===mode?"true":"false");}});
        try{localStorage.setItem(VIEW_KEY,mode);}catch(e){}
        if(mode==="preview"||mode==="both") refreshPreview();
    }
    var savedView=localStorage.getItem(VIEW_KEY);
    if(savedView!=="both"&&savedView!=="preview") savedView="write";
    setView(savedView);
    if(viewBtns.write) viewBtns.write.addEventListener("click",function(){setView("write");});
    if(viewBtns.both) viewBtns.both.addEventListener("click",function(){setView("both");});
    if(viewBtns.preview) viewBtns.preview.addEventListener("click",function(){setView("preview");});

    /* sidebar + inspector — hidden by default for focus */
    var btnSidebar=document.getElementById("btn-sidebar");
    (function(){
        var v=localStorage.getItem(SIDEBAR_KEY);
        if(v==="0"&&el.sidebar) el.sidebar.classList.remove("hidden");
        else if(v==="1"&&el.sidebar) el.sidebar.classList.add("hidden");
    })();
    if(btnSidebar&&el.sidebar) btnSidebar.addEventListener("click",function(){
        var hidden=el.sidebar.classList.toggle("hidden");
        try{localStorage.setItem(SIDEBAR_KEY,hidden?"1":"0");}catch(e){}
    });
    (function(){
        var v=localStorage.getItem(INSP_KEY);
        if(v==="0"&&el.inspector) el.inspector.classList.remove("hidden");
    })();
    var sbDetails=document.getElementById("sb-focus-details");
    if(sbDetails) sbDetails.addEventListener("click",function(){
        var open=!el.details.classList.contains("open");
        el.details.classList.toggle("open",open);
        el.btnDetailsLabel.textContent=open?"Hide details":"Details";
        try{localStorage.setItem(DETAILS_KEY,open?"1":"0");}catch(e){}
        el.details.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
    var sbPreview=document.getElementById("sb-open-preview");
    if(sbPreview) sbPreview.addEventListener("click",function(){setView("preview");});

    /* zen focus — hide chrome */
    var winEl=document.querySelector(".window");
    var btnFocus=document.getElementById("btn-focus");
    var btnFocusTb=document.getElementById("btn-focus-toolbar");
    var btnZenExit=document.getElementById("zen-exit");
    function setZen(on){
        if(!winEl) return;
        winEl.classList.toggle("is-zen",!!on);
        if(btnFocus) btnFocus.classList.toggle("is-active",!!on);
        try{localStorage.setItem(ZEN_KEY,on?"1":"0");}catch(e){}
    }
    var zenSaved=localStorage.getItem(ZEN_KEY)==="1";
    if(zenSaved) setZen(true);
    function toggleZen(){ setZen(!winEl.classList.contains("is-zen")); }
    if(btnFocus) btnFocus.addEventListener("click",toggleZen);
    if(btnFocusTb) btnFocusTb.addEventListener("click",toggleZen);
    if(btnZenExit) btnZenExit.addEventListener("click",function(){setZen(false);});
    commands.push({id:"zen",g:"Actions",ic:"fa-solid fa-expand",label:"Toggle focus",desc:"zen · hide chrome",run:toggleZen});
    commandsById["zen"]=commands[commands.length-1];

    document.addEventListener("keydown",function(e){
        if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveDraft();toast("Saved");}
        else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();togglePalette();}
        else if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key.toLowerCase()==="c"){e.preventDefault();copyText(postHtml(),"HTML copied");}
        else if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();toggleZen();}
        else if(e.key==="Escape"){ closeAllMenus(); closeLibrary(); if(winEl&&winEl.classList.contains("is-zen")) setZen(false); }
    });
    window.addEventListener("beforeunload",function(){saveDraft();});

    el.date.value=todayDisplay();
    var restored=restoreDraft();
    slugTouched=restored;
    if(restored)pillStatus(true);
    autosize(el.body);
    render();
})();
