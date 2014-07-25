// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';


(function() {
  if (window.FPSMeter)
    return;

  function printTime(ms)
  {
      var _seconds = Math.floor(ms / 1000);
      var minutes = Math.floor(_seconds / 60);
      var seconds = _seconds % 60;
      return '' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }

  function setupGoogleChart(div, chartOpts)
  {
      chartOpts.options = {
          title:null,
          legend: {position:"none"},
          backgroundColor:"white",
          width: chartOpts.chartBox.style.width,
          height: chartOpts.chartBox.style.height,
          vAxis: {title: null, ticks: [0,60,120]},
          hAxis: {title: null, ticks: []},
          isStacked: true
      }; // options

      var gscript = document.createElement('script');
      gscript.setAttribute("type", "application/javascript");
      gscript.setAttribute("id", "XX-GMPlusGoogle-XX");
      div.appendChild(gscript);

      // event listener setup
      gscript.addEventListener("load",
          function changeCB(params) {
              gscript.removeEventListener("load", changeCB);
              google.load("visualization", "1", {packages:["corechart"],
                  "callback": function drawChart() {
                      chartOpts.chart = new google.visualization.LineChart(chartOpts.chartBox);
                  }
              });
          }
      );
      gscript.src = "http://www.google.com/jsapi";
  }

  function FPSMeter() {
    this.classList.add('fps-meter');
    this.style.boxSizing = 'border-box';
    this.style.width = '300px';
    this.style.height = '100px';
    this.style.padding = '4px';
    this.style.border = '1px solid black';
    this.style.fontSize = '12px';
    this.style.lineHeight = '100%';

    this.startTime = Date.now();
    this.last = this.startTime;
    this.fps = [['Date', 'FPS']];


    this.textBox = document.createElement('div');
    this.textBox.style.fontSize = '12px';
    this.textBox.style.lineHeight = '100%';
    this.textBox.style.border = '1px solid black';
    this.textBox.style.width = '100px';
    this.appendChild(this.textBox);


    this.chartBox = document.createElement('div');
    this.chartBox.style.border = '1px solid black';
    this.chartBox.style.position = 'absolute';
    this.chartBox.style.left = '108px';
    this.chartBox.style.top = '0px';
    this.chartBox.style.width = '188px';
    this.chartBox.style.height = '96px';
    this.appendChild(this.chartBox);

    this.chartOpts = {chartBox:this.chartBox};

    setupGoogleChart(this, this.chartOpts);

    this.updateContents_();
  }

  FPSMeter.prototype = {
    __proto__: HTMLDivElement.prototype,

    updateContents_: function() {
      var now = Date.now();
      var totalTime = printTime(now - this.startTime);
      var elapsedTime = now - this.last;

      var frames = window.performance.getEntriesByType("draw").length;

      // hack... sometimes the frames get delivered to the performance object
      // in a burst so it looks like we get 112 frames one second then 8 the
      // next. It smooths out over 2 seconds though.
      if(frames > 100 && elapsedTime < 1500) return;

      try {window.performance.webkitClearDrawTimings(); } catch(e) {}

      var fps = frames / elapsedTime * 1000;

      this.fps.push([now,fps]);
      if((this.fps[1][0] + 15000) < now)
        this.fps.splice(1,1);

      console.log('Frames: ' + frames + '  FPS: '+ fps.toFixed(2));

      this.last = now;
      this.textBox.innerHTML =
            'Total time: ' + totalTime + '<br/>'
          + 'Elapsed: ' + elapsedTime/1000 + '<br/>'
          + 'Frames: ' + frames + '<br/>'
          + 'FPS: ' + fps.toFixed(2);

      if(this.chartOpts.chart){

        var data = google.visualization.arrayToDataTable(this.fps);
        this.chartOpts.chart.draw(data, this.chartOpts.options);
      }
    }
  };

  window.FPSMeter = function() {
    var div = document.createElement('div');
    div.__proto__ = FPSMeter.prototype;
    div.constuctor = FPSMeter;
    FPSMeter.call(div);
    return div;
  }

})();
