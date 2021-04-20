
changeimgurl();
function loadImageAnnotation(newArray) {
    try {
        for (var i = 0; i < newArray.length; i++) {
            if (/^anno_(\w+)$/.test(newArray[i].id)) {
                var newel = document.createElement('div');
                newel.setAttribute('class', 'point')
                newel.setAttribute('title', "Click to edit Annotation")
                newel.setAttribute('data-toggle', "tooltip")
                newel.setAttribute('data-placement', "bottom")

                newel.style.left = newArray[i].left + 'px';
                newel.style.top = newArray[i].top + 'px';
                newel.id = newArray[i].id;
                var find_id = newArray[i].ImageTagId;
                if (document.getElementById(find_id)) {
                    var canvas_id = "canvas_" + find_id;
                    var canvas = document.getElementById(canvas_id);
                    newel.style.width = newArray[i].width + 'px'
                    newel.style.height = newArray[i].height + 'px'
                    newel.style.maxWidth = document.getElementById(find_id).width - (newArray[i].left - document.getElementById(find_id).offsetLeft) + 'px';
                    newel.style.maxHeight = document.getElementById(find_id).height - (newArray[i].top - document.getElementById(find_id).offsetTop) + 'px';
                    if (canvas) {
                        $(canvas).append(newel);
                    }
                }
                var newell = document.createElement('div');
                newell.innerHTML = newArray[i].test;
                newell.setAttribute('class', 'point-text')
                newell.setAttribute('contenteditable', 'false')
                 newell.classList.add('canvas_seq_'+newArray[i].authorsequence)
                newell.style.left = newArray[i].left + 'px';
                newell.style.top = newArray[i].top + newArray[i].height + 10 + 'px';
                var anno_id = newArray[i].id;
                newell.id = 'text_' + anno_id;
                if (canvas) {
                    $(canvas).append(newell);
                }
            }
        }

        // blinkindexterm(self);
    } catch (e) {
        console.warn(e)
    }
}

function getdimen(id, naturalHeight, naturalWidth, src) {

    var canvas1 = document.createElement('div');
    canvas1.setAttribute('canvas-id', id)
    canvas1.id = 'canvas_' + id;
    canvas1.className = 'canvas';
    canvas1.style.width = naturalWidth + 'px';
    canvas1.style.height = naturalHeight + 'px';
    canvas1.style.position = "relative";
    canvas1.style.backgroundImage = 'url(' + src + ')';
    if (id) {
        document.getElementById(id).style.display = 'none';
    }
    var edit_anno = document.createElement('div');
    edit_anno.id = 'image-anno-edit' + id;
    edit_anno.className = 'image-anno-edit';
    $(canvas1).append(edit_anno)
    $("#" + id).parent().append(canvas1);
}

function Imagecanvas(data1, token) {
    var len = data1.length;
    for (var i = 0; i < len; i++) {
        var data = data1[i];
        if (document.getElementById(data['ImageTagId']) && data['test'] != "" && data['test'] != null) {
            var img = document.getElementById(data['ImageTagId']);
            img.style.display = 'block';
            const img_name = img.getAttribute('fileref');
            var src = BaseUrl + '/serveImage?token=' + token + "&name=" + img_name;
            img.setAttribute('src', src);
            getdimen(img.getAttribute("id"), img.clientHeight, img.clientWidth, src);
            loadImageAnnotation(data1);
        }
    }
}
function changeimgurl() {
    var imgs = document.querySelectorAll("img");
    var len = imgs.length;
    for (var i = 0; i < len; i++) {
        imgs[i].style.display = 'block';
        const img_name = imgs[i].getAttribute('fileref');
        var src = BaseUrl + '/serveImage?token=' + object.token + "&name=" + img_name;
        imgs[i].setAttribute('src', src);
    }
}