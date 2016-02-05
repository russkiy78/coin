/**
 * Created by russkiy on 09.12.15.
 */
function http_get(url) {
    var d = Deferred();
    var xhr = new XmlHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;
        if (xhr.status==200){
            d.call(xhr.responseText);
        } else {
            d.fail(xhr.statusText);
        }
    }
    xhr.send(null);

    return d;
}

// ================================================================
// validateEmail  validate email
// ================================================================
function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

// ================================================================
// Not crypto random (not use for cipher)
// ================================================================
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ================================================================
//Async load scripts
// ================================================================
function addScript(src){
    var script = document.createElement('script');
    script.src = src;
    script.async = false; //
    document.head.appendChild(script);
}