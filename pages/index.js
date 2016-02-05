/**
 * Created by russkiy on 09.12.15.
 */
// Support File API
if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
     alert('The File APIs are not fully supported in this browser.');
}

var blocksizes =[10000,1000000];


var server = "http://localhost:8000/";
var userdata = false;
var cryptovault = new Cryptovault();





// global   data
// ================================================================
var userdata = false;
var mdpass = false;
var hash=false;
var uploadTasks =[];
var downloadEvents =[];
var fileBlockSize = 265;
var minfileBlockSize = 64;

// ================================================================


// ================================================================
// Set user  params in HTML after login
// ================================================================
function InitUser () {
    $('#loginspan').html(userdata.email);
}

$(document).ready(function () {




    // user not login in
    // ================================================================
    if (!userdata) {

        // open login modal
        // ================================================================
        var logindiv = $('#loginModal');
        logindiv.modal({keyboard: false, backdrop: 'static'});

        //   login modal showed
        // ================================================================
        logindiv.on('shown.bs.modal', function () {

            // show/hide local file
            // ================================================================
            $('#local').on('change', function () {
                var local = $("#local").prop("checked") ? true : false;
                if (local) {
                    $('#userfile').removeClass('hidden');
                } else {
                    $('#userfile').addClass('hidden');
                }
            });

            // buttonLogin click
            // ================================================================
            $("#buttonLogin").on("click", function () {

                var email = $("#email").val();
                var password = $("#password").val();
                var userfile = $("#userfile");

                var local = $("#local").prop("checked") ? true : false;
                var modaldiv=$('#loginModal');

                // minnimum checks
                // ================================================================
                if (!email || !validateEmail(email)) {
                    alert('wrong email');
                    return 0;
                }
                if (!password) {
                    alert('password not match!');
                    return 0;
                }
                if (local && !userfile.val()) {
                    alert('choose file!');
                    return 0;
                }
                // auth
                // ================================================================
                 hash = cryptovault.bytesToHex(cryptovault.SHA256(password + "\u0000" + email ));
                console.log(hash);
                $.post(server, { command: "auth", email: email, hash:  hash })
                    .fail(function() {
                        alert( "error server connect" );
                        modaldiv.modal('hide');
                    })
                    .done(function (data) {
                        if (data.error !== undefined && data.error > 0) {
                            alert(data.text)
                            return 0;
                        } else {
                            // get session key!
                            // ================================================================
                            $.post(server, { command: "getsessionkey", email: email, hash:  hash })
                                .fail(function() {
                                    alert( "error server connect" );
                                    modaldiv.modal('hide');
                                })
                                .done(function (data) {
                                    if (data.error !== undefined && data.error > 0) {
                                        alert(data.text)
                                        return 0;
                                    } else {

                                        // create temp password for encrypt  userdata
                                        // ================================================================
                                         mdpass = cryptovault.SHA256(cryptovault.decode64(data.sessionkey) + password);
                                         password='';

                                        if (!local) {
                                            // get user data from server
                                            // ================================================================
                                            $.post(server, { command: "getdata", email: email, hash:  hash })
                                                .fail(function() {
                                                    alert( "error server connect" );
                                                    modaldiv.modal('hide');
                                                })
                                                .done(function (data) {

                                                    //TODO make try catch!
                                                    var tdata = pako.inflate(data, {to: 'string'});
                                                    tdata = JSON.parse(tdata);
                                                    tdata = cryptovault.AESdecrypt(mdpass, tdata);
                                                    tdata = pako.inflate(tdata.data, {to: 'string'});
                                                    userdata = JSON.parse(tdata);
                                                    InitUser();
                                                    modaldiv.modal('hide');

                                                });


                                        } else {

                                            // get user data from local file
                                            // ================================================================
                                            var reader = new FileReader();
                                            reader.onload = function(e) {
                                                if (e && e.target.result !== undefined) {

                                                    //TODO make try catch!
                                                    var tdata = pako.inflate(e.target.result, {to: 'string'});
                                                    tdata = JSON.parse(tdata);
                                                    tdata = cryptovault.AESdecrypt(mdpass, tdata);
                                                    tdata = pako.inflate(tdata.data, {to: 'string'});
                                                    userdata = JSON.parse(tdata);
                                                    InitUser();
                                                    modaldiv.modal('hide');
                                                }

                                            };
                                             reader.readAsText(userfile[0].files[0], "UTF-8")
                                        }
                                    }
                                });
                        }
                    });
            });
        });
    }




    function readBlob(files, opt_startByte, opt_stopByte) {

        if (!files.length) {
            alert('Please select a file!');
            return;
        }

        var file = files[0];
        var start = parseInt(opt_startByte) || 0;
        var stop = parseInt(opt_stopByte) || file.size - 1;

        var reader = new FileReader();

        // If we use onloadend, we need to check the readyState.
        reader.onloadend = function(evt) {
            if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                document.getElementById('byte_content').textContent = evt.target.result;
                document.getElementById('byte_range').textContent =
                    ['Read bytes: ', start + 1, ' - ', stop + 1,
                        ' of ', file.size, ' byte file'].join('');
            }
        };

        if (file.webkitSlice) {
            var blob = file.webkitSlice(start, stop + 1);
        } else if (file.mozSlice) {
            var blob = file.mozSlice(start, stop + 1);
        }
        reader.readAsBinaryString(blob);
    }




        // add file
        // ================================================================
        $("#buttonAddfile").on("click", function () {

            var addfile=$("#addfile");

            if (userdata && addfile[0].files[0] !== undefined && addfile[0].files[0].size >0 ) {

                var file=addfile[0].files[0];

               // console.log (file);

                var loadfile = new Worker('js/workers/loadfile.js');

                loadfile.addEventListener('message', function(e) {
                  //  console.log('Worker said: ', e.data);
                }, false);

                loadfile.postMessage({file: file, mdpass: mdpass});


               /*
                var reader = new FileReaderSync();

                reader.onloadend = function(evt) {
                    if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                        console.log(evt);
                    }
                };

                // start new event
                // ================================================================

                if (file.size < minfileBlockSize*fileBlockSize) {
                    var sliceSize=file.size;
                    var slices= 1

                } else {
                    var sliceSize=getRandomInt(minfileBlockSize,Math.ceil(file.size / fileBlockSize));
                    var slices= Math.ceil(file.size / (sliceSize*fileBlockSize));

                }

                if (file.webkitSlice) {
                    var blob = file.webkitSlice(0, 128);
                } else if (file.mozSlice) {
                    var blob = file.mozSlice(0, 128);
                } else if (file.slice()) {
                    var blob = file.slice(0, 128);
                }

                reader.onloadend = function(evt) {
                    console.log(evt);
                    if (evt.target.readyState == FileReader.DONE) { // DONE == 2

                    }
                };



                console.log(blob);


                for (var i=1;i<=slices;i++) {
                    var startSlice=sliceSize*fileBlockSize*(i-1);
                    var stopSlice=file.size - sliceSize*fileBlockSize*i > 0 ? sliceSize*fileBlockSize*i : file.size;



                    console.log(i+" file.size="+file.size+" sliceSize="+sliceSize+" fileBlockSize="+fileBlockSize+" sliceSize*fileBlockSize*i="+(sliceSize*fileBlockSize*i)+
                        " "+(file.size - sliceSize*fileBlockSize*i > 0 ? sliceSize*fileBlockSize : sliceSize*fileBlockSize-(sliceSize*fileBlockSize*i-file.size)));

                }
*/



                /*

                 lastModified: 1447053157798
                 lastModifiedDate: Mon Nov 09 2015 10:12:37 GMT+0300 (MSK)
                 name: "rarlinux-5.3.b6.tar.gz"
                 size: 1115220
                 type: "application/gzip"
                 webkitRelativePath: ""

                                document.querySelector('.readBytesButtons').addEventListener('click', function(evt) {
                                    if (evt.target.tagName.toLowerCase() == 'button') {
                                        var startByte = evt.target.getAttribute('data-startbyte');
                                        var endByte = evt.target.getAttribute('data-endbyte');
                                        readBlob(startByte, endByte);
                                    }
                                }, false);

                */










                /*
                var rblocksize=getRandomInt(blocksizes[0],blocksizes[1]);


                var file = addfile[0].files[0];
                var start = parseInt(0) || 0;
                var stop = parseInt(rblocksize) || file.size - 1;

                var reader = new FileReader();





                /*
                 var reader = new FileReader();

                 reader.onload = function(e) {
                 if (e && e.target.result !== undefined) {

                 //TODO make try catch!
                 var tdata = pako.inflate(e.target.result, {to: 'string'});
                 tdata = JSON.parse(tdata);
                 tdata = cryptovault.AESdecrypt(mdpass, tdata);
                 tdata = pako.inflate(tdata.data, {to: 'string'});
                 userdata = JSON.parse(tdata);
                 InitUser();
                 modaldiv.modal('hide');
                 }

                 };
                 reader.readAsText(userfile[0].files[0], "UTF-8")
                 */

            }
        });




});