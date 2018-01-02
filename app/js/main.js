window.onload = function() {
    app.init();

}


var app = {


    init: function() {

        navigator.getUserMedia = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);


        var audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        var voiceSelect = document.getElementById("voice");
        var source;
        var stream;
        var buff = 1024;


        var analyser = audioCtx.createAnalyser();
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        analyser.smoothingTimeConstant = 0.85;

        var distortion = audioCtx.createWaveShaper();
        var gainNode = audioCtx.createGain();
        var biquadFilter = audioCtx.createBiquadFilter();
        var convolver = audioCtx.createConvolver();

        function makeDistortionCurve(amount) {
            var k = typeof amount === 'number' ? amount : 50,
                n_samples = 44100,
                curve = new Float32Array(n_samples),
                deg = Math.PI / 180,
                i = 0,
                x;
            for (; i < n_samples; ++i) {
                x = i * 2 / n_samples - 1;
                curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
            }
            return curve;
        };

        // grab audio track via XHR for convolver node

        var soundSource, concertHallBuffer;

        ajaxRequest = new XMLHttpRequest();

        ajaxRequest.open('GET', 'https://mdn.github.io/voice-change-o-matic/audio/concert-crowd.ogg', true);

        ajaxRequest.responseType = 'arraybuffer';


        ajaxRequest.onload = function() {
            var audioData = ajaxRequest.response;

            audioCtx.decodeAudioData(audioData, function(buffer) {
                concertHallBuffer = buffer;
                soundSource = audioCtx.createBufferSource();
                soundSource.buffer = concertHallBuffer;
            }, function(e) { console.log("Error with decoding audio data" + e.err); });

            //soundSource.connect(audioCtx.destination);
            //soundSource.loop = true;
            //soundSource.start();
        };

        ajaxRequest.send();

        // set up canvas context for visualizer

        var canvas = document.querySelector('.visualizer');
        var canvas2 = document.querySelector('.visualizer2');

        var canvasCtx = canvas.getContext("2d");
        var canvasCtx2 = canvas2.getContext("2d");

        var intendedWidth = document.querySelector('.wrapper').clientWidth;

        canvas.setAttribute('width', intendedWidth);
        canvas2.setAttribute('width', intendedWidth);

        // var visualSelect = document.getElementById("visual");

        var drawVisual;

        //main block for doing the audio recording

        if (navigator.getUserMedia) {
            console.log('getUserMedia supported.');
            navigator.getUserMedia(
                // constraints - only audio needed for this app
                {
                    audio: true
                },

                // Success callback
                function(stream) {
                    source = audioCtx.createMediaStreamSource(stream);
                    source.connect(analyser);
                    analyser.connect(distortion);
                    distortion.connect(biquadFilter);
                    biquadFilter.connect(convolver);
                    convolver.connect(gainNode);
                    gainNode.connect(audioCtx.destination);

                    visualize();
                    //voiceChange();

                },

                // Error callback
                function(err) {
                    console.log('The following gUM error occured: ' + err);
                }
            );
        } else {
            console.log('getUserMedia not supported on your browser!');
        }



        var w = $(window).width();
        var h = $(window).height() / 2;

        console.log(w, h)

        $('canvas').attr('width', w);
        $('canvas').attr('height', h);

        function visualize() {


            WIDTH = canvas.width;
            HEIGHT = canvas.height;

            // var visualSetting = visualSelect.value;
            //var visualSetting = "frequencybars";
            //console.log(visualSetting);

            sinewave();
            frequencybars();
            // otra();



            function sinewave() {

                analyser.fftSize = buff;
                var bufferLength = analyser.fftSize;
                // console.log(bufferLength);
                var dataArray = new Uint8Array(bufferLength);

                canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

                var draw = function() {

                    drawVisual = requestAnimationFrame(draw);

                    analyser.getByteTimeDomainData(dataArray);

                    //console.log(dataArray)

                    canvasCtx.fillStyle = 'rgb(0,0,0)';
                    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

                    canvasCtx.lineWidth = 2;
                    canvasCtx.strokeStyle = 'rgb(255, 50, 50)';

                    canvasCtx.beginPath();

                    var sliceWidth = WIDTH * 1.0 / bufferLength;
                    var x = 0;

                    for (var i = 0; i < bufferLength; i++) {

                        var v = dataArray[i] / 128.0;
                        var y = v * HEIGHT / 2;

                        if (i === 0) {
                            canvasCtx.moveTo(x, y);
                        } else {
                            canvasCtx.lineTo(x, y);
                        }

                        x += sliceWidth;
                    }

                    canvasCtx.lineTo(canvas.width, canvas.height / 2);
                    canvasCtx.stroke();
                };

                draw();
            }

            function frequencybars() {
                analyser.fftSize = buff;
                var bufferLengthAlt = analyser.frequencyBinCount;
                //console.log(bufferLengthAlt);
                var dataArrayAlt = new Uint8Array(bufferLengthAlt);

                canvasCtx2.clearRect(0, 0, WIDTH, HEIGHT);

                var drawAlt = function() {
                    drawVisual = requestAnimationFrame(drawAlt);

                    analyser.getByteFrequencyData(dataArrayAlt);

                    canvasCtx2.fillStyle = 'rgb(0, 0, 0)';
                    canvasCtx2.fillRect(0, 0, WIDTH, HEIGHT);

                    var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
                    var barHeight;
                    var x = 0;

                    for (var i = 0; i < bufferLengthAlt; i++) {
                        barHeight = dataArrayAlt[i] * 4;

                        canvasCtx2.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
                        canvasCtx2.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

                        x += barWidth + 1;
                    }
                };

                drawAlt();

            }

            function otra() {
                analyser.fftSize = buff;
                var longitudBuffer = analyser.frequencyBinCount;
                var cantidadDatos = new Uint8Array(longitudBuffer);

                //console.log(longitudBuffer, cantidadDatos);
                $('canvas').hide();

                var anch = Math.round( w / (longitudBuffer/29.3) );
                var alt = Math.round( h / (longitudBuffer/39.5) );;

                for (var i = 0; i < longitudBuffer; i++) {
                    $('.wrapper').append('<div class="cuadrado" id="c'+i+'" style="width:'+anch+'px; height:'+alt+'px"></div>')
                }
                

                var dibuja = function() {
                    drawVisual = requestAnimationFrame(dibuja);
                    analyser.getByteFrequencyData(cantidadDatos);

                    var col = 0;

                    var $cuadrado = $('.cuadrado');

                    for (var i = 0; i < longitudBuffer; i++) {

                        var color = cantidadDatos[i]*2;

                        $("#c"+i).css('background-color', 'rgb(' + (color + 0) + ', 0, 0)');

                        if(col < 255){
                            col++
                        }else{
                            col = 0;
                        }
                        
                    }

                };

                dibuja();
            }


        }

        /*function voiceChange() {

            distortion.oversample = '4x';
            biquadFilter.gain.value = 0;
            convolver.buffer = undefined;

            var voiceSetting = voiceSelect.value;
            console.log(voiceSetting);

            if (voiceSetting == "distortion") {
                distortion.curve = makeDistortionCurve(400);
            } else if (voiceSetting == "convolver") {
                convolver.buffer = concertHallBuffer;
            } else if (voiceSetting == "biquad") {
                biquadFilter.type = "lowshelf";
                biquadFilter.frequency.value = 1000;
                biquadFilter.gain.value = 25;
            } else if (voiceSetting == "off") {
                console.log("Voice settings turned off");
            }

        }*/

        // event listeners to change visualize and voice settings

        /*        visualSelect.onchange = function() {
                    window.cancelAnimationFrame(drawVisual);
                    visualize();
                };

                voiceSelect.onchange = function() {
                    voiceChange();
                };

                mute.onclick = voiceMute;

                function voiceMute() {
                    if (mute.id === "") {
                        gainNode.gain.value = 0;
                        mute.id = "activated";
                        mute.innerHTML = "Unmute";
                    } else {
                        gainNode.gain.value = 1;
                        mute.id = "";
                        mute.innerHTML = "Mute";
                    }
                }*/


    }




}