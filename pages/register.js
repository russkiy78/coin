/**
 * Created by russkiy on 16.11.15.
 */

var server = "http://localhost:8000/";
var cryptovault = new Cryptovault();


$(document).ready(function () {
    $("#buttonRegister").on("click", function () {


        var email = $("#email").val();
        var password1 = $("#password1").val();
        var password2 = $("#password2").val();
        var local = $("#local").prop("checked") ? true : false;
        var modaldiv = $('#myModal');

        // check
        // ================================================================
        if (!email || !validateEmail(email)) {
            alert('wrong email');
            return 0;
        }

        if (!password1 && password1 != password2) {
            alert('password not match!');
            return 0;
        }


        modaldiv.modal({keyboard: false, backdrop: 'static'});

        //   login modal showed
        // ================================================================
        modaldiv.on('shown.bs.modal', function () {

            // create hash based on password
            // ================================================================
            var hash = cryptovault.bytesToHex(cryptovault.SHA256(password1 + "\u0000" + email));
            // create random hash for link user files to him
            // ================================================================
            var filehash = cryptovault.CreateHash();
            // place

            // create RSA keypair
            // ================================================================
            var keys = cryptovault.RSAcreatekeypair();

            // register
            // ================================================================
            $.post(server, {command: "register", email: email, hash: hash, filehash: filehash, openkey: keys.publicKey})
                .fail(function () {
                    alert("error server connect");
                    modaldiv.modal('hide');
                })
                .done(function (data) {

                    if (data.error !== undefined && data.error > 0) {
                        modaldiv.modal('hide');
                        alert(data.text)
                    } else {


                        // create first sessionkey
                        // ================================================================
                        $.post(server, {command: "updatesessionkey", email: email, hash: hash})
                            .fail(function () {
                                alert("error server connect");
                                modaldiv.modal('hide');
                            })
                            .done(function (data) {

                                if (!(data.error !== undefined && data.error > 0)) {

                                    // create temp password for encrypt  userdata
                                    // ================================================================
                                    var mdpass = cryptovault.SHA256(cryptovault.decode64(data.sessionkey) + password1);

                                    // create first userdata
                                    // ================================================================
                                    var userdata = {
                                        email: email,
                                        privateKey: keys.privateKey,
                                        publicKey: keys.publicKey,
                                        filesystem: {
                                            files: [],
                                            dirs: []
                                        }
                                    };

                                    //  encrypt and pack userdata
                                    // ================================================================
                                    // pack JSON data. result: binary string
                                    var userdataDeflate = pako.deflate(JSON.stringify(userdata), {to: 'string'});
                                    // encrypt with temporary pass.  result {iv: '', encode:''}
                                    var userdataEncrypted = cryptovault.AESencrypt(mdpass, userdataDeflate);
                                    // pack encrypted JSON data. result: binary string
                                    userdataDeflate = pako.deflate(JSON.stringify(userdataEncrypted), {to: 'string'});

                                    //  if save in local file
                                    // ================================================================
                                    if (local) {
                                        var blob = new Blob([userdataDeflate], {type: "text/plain;charset=utf-8"});

                                        //  save with saveAs lib
                                        // ================================================================
                                        saveAs(blob, "myvault.txt");
                                        modaldiv.modal('hide');

                                    } else {
                                        //  if save userdata on server
                                        // ================================================================
                                        $.post(server, {
                                            command: "updatedata",
                                            email: email,
                                            hash: hash,
                                            data: userdataDeflate
                                        })
                                            .fail(function () {
                                                alert("error server connect");
                                                modaldiv.modal('hide');
                                            })
                                            .done(function (data) {
                                                if (data.error !== undefined && data.error > 0) {
                                                    modaldiv.modal('hide');
                                                    alert(data.text)
                                                } else {
                                                    modaldiv.modal('hide');

                                                    //  success - go on index.html page
                                                    // ================================================================
                                                    alert('Success register!');
                                                    document.location.href = 'index.html';
                                                }
                                            });
                                    }
                                } else {
                                    modaldiv.modal('hide');
                                    alert(data.text)
                                }
                            });
                    }

                });
        });

    });

});

