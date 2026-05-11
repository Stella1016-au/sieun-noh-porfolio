/**
 * Ascii Flow Trail — vanilla port of Framer module Ascii_FlowTrail
 * (https://framer.com/m/Ascii-FlowTrail-1wMf.js)
 * Same defaults and drawing math; React/Framer removed for static HTML.
 */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var canvas = document.getElementById("ascii-flow-trail");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  function accentTint() {
    var raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent")
      .trim();
    return raw || "#6e5f48";
  }

  /** Framer default props **/
  var glyphSet = 3;
  var scale = 24;
  var gamma = 0;
  var mix = 100;
  var invertOrder = true;
  var monochrome = true;
  var blendMode = "Normal";
  var radius = 20;
  var strength = 82;
  var turbulence = 100;
  var colorMix = 100;
  var tailLength = 100;
  var drawBlendMode = "Screen";
  var trackMouse = 100;
  var momentum = 42;

  var tint = accentTint();

  var mousePos = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  var smoothPos = { x: mousePos.x, y: mousePos.y };
  var trail = [];
  var time = 0;
  var frameId;

  function parseTint(color) {
    var tintR = 255,
      tintG = 255,
      tintB = 255;
    if (typeof color === "string") {
      if (color.startsWith("#")) {
        tintR = parseInt(color.slice(1, 3), 16);
        tintG = parseInt(color.slice(3, 5), 16);
        tintB = parseInt(color.slice(5, 7), 16);
      } else if (color.startsWith("rgb")) {
        var matches = color.match(/\d+/g);
        if (matches && matches.length >= 3) {
          tintR = parseInt(matches[0], 10);
          tintG = parseInt(matches[1], 10);
          tintB = parseInt(matches[2], 10);
        }
      }
    }
    return { r: tintR, g: tintG, b: tintB };
  }

  var baseChars;
  switch (glyphSet) {
    case 0:
      baseChars = "●•·. ";
      break;
    case 1:
      baseChars = "■□▪▫ ";
      break;
    case 2:
      baseChars = "█▓▒░ ";
      break;
    case 3:
      baseChars = "▣▤▥▦▧▨▩ ";
      break;
    case 4:
      baseChars = "◆◇◈○◉◊◌ ";
      break;
    default:
      baseChars = "@%#*+=-:. ";
  }

  var chars = invertOrder
    ? baseChars.split("").reverse().join("")
    : baseChars;

  var tintRgb = parseTint(tint);

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function onPointer(ev) {
    var x;
    var y;
    if (ev.touches && ev.touches.length) {
      x = ev.touches[0].clientX;
      y = ev.touches[0].clientY;
    } else {
      x = ev.clientX;
      y = ev.clientY;
    }
    mousePos.x = x;
    mousePos.y = y;
  }

  function applyCanvasBlend(mode) {
    if (mode === "Add") {
      ctx.globalCompositeOperation = "lighter";
    } else if (mode === "Screen") {
      ctx.globalCompositeOperation = "screen";
    } else if (mode === "Multiply") {
      ctx.globalCompositeOperation = "multiply";
    } else if (mode === "Difference") {
      ctx.globalCompositeOperation = "difference";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function blendIntensity(mode, intensity, value) {
    if (mode === "Add") return intensity + value;
    if (mode === "Multiply") return intensity * value;
    if (mode === "Difference") return Math.abs(intensity - value);
    if (mode === "Screen") return 1 - (1 - intensity) * (1 - value);
    return Math.max(intensity, value);
  }

  function animate() {
    time += 0.016;

    var w = window.innerWidth;
    var h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    tintRgb = parseTint(accentTint());

    var targetX = mousePos.x;
    var targetY = mousePos.y;

    if (trackMouse < 100) {
      var autoX = w / 2 + Math.sin(time) * 150;
      var autoY = h / 2 + Math.cos(time * 0.7) * 150;
      var trackFactor = trackMouse / 100;
      targetX = mousePos.x * trackFactor + autoX * (1 - trackFactor);
      targetY = mousePos.y * trackFactor + autoY * (1 - trackFactor);
    }

    var momentumFactor = 1 - (momentum / 100) * 0.95;
    smoothPos.x += (targetX - smoothPos.x) * momentumFactor;
    smoothPos.y += (targetY - smoothPos.y) * momentumFactor;

    trail.push({ x: smoothPos.x, y: smoothPos.y, life: 1 });

    var maxLength = Math.floor((tailLength / 100) * 50) + 5;
    while (trail.length > maxLength) {
      trail.shift();
    }

    var decay = 0.02 * (1 - tailLength / 100) + 0.01;
    for (var ti = 0; ti < trail.length; ti++) {
      trail[ti].life -= decay;
    }
    trail = trail.filter(function (p) {
      return p.life > 0;
    });

    var charSize = Math.max(6, Math.floor((16 * scale) / 100));
    ctx.font = charSize + "px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    applyCanvasBlend(blendMode);

    var cols = Math.ceil(w / charSize);
    var rows = Math.ceil(h / charSize);
    var tintR = tintRgb.r,
      tintG = tintRgb.g,
      tintB = tintRgb.b;

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var xx = col * charSize + charSize / 2;
        var yy = row * charSize + charSize / 2;

        var intensity = 0;
        for (var pi = 0; pi < trail.length; pi++) {
          var point = trail[pi];
          var dx = xx - point.x;
          var dy = yy - point.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var maxDist = (radius / 100) * 150;
          if (dist < maxDist) {
            var rawVal = ((1 - dist / maxDist) * point.life * strength) / 100;
            intensity = blendIntensity(
              drawBlendMode,
              intensity,
              rawVal
            );
          }
        }

        if (turbulence > 0 && intensity > 0) {
          var turb =
            Math.sin(xx * 0.01 + time) *
            Math.cos(yy * 0.01 + time * 0.7) *
            (turbulence / 1000);
          intensity += turb;
        }

        if (gamma !== 0 && intensity > 0) {
          intensity = Math.pow(intensity, 1 - gamma);
        }

        if (glyphSet > 0 && intensity > 0) {
          var ditherAmount = 0.2;
          if (glyphSet === 1) {
            intensity += (Math.sin(col * 0.5) + Math.cos(row * 0.5)) * ditherAmount;
          } else if (glyphSet === 2) {
            intensity += ((col % 2) + (row % 2)) * ditherAmount - ditherAmount;
          } else if (glyphSet === 3) {
            var bayer = [
              [0, 8, 2, 10],
              [12, 4, 14, 6],
              [3, 11, 1, 9],
              [15, 7, 13, 5],
            ];
            var threshold = bayer[row % 4][col % 4] / 16;
            intensity = intensity > threshold ? 1 : intensity * 0.5;
          } else if (glyphSet === 4 || glyphSet === 5) {
            intensity += Math.random() * ditherAmount - ditherAmount / 2;
          }
        }

        intensity = Math.max(0, Math.min(1, intensity));

        if (intensity > 0.01) {
          var charIndex = Math.min(
            chars.length - 1,
            Math.floor(intensity * chars.length)
          );
          var char = chars.charAt(charIndex);
          var alpha = intensity * (mix / 100);

          if (monochrome) {
            ctx.fillStyle =
              "rgba(" + tintR + ", " + tintG + ", " + tintB + ", " + alpha + ")";
          } else {
            var mixFactor = colorMix / 100;
            var brightness = intensity;
            var r = Math.round(
              255 * brightness * (1 - mixFactor) +
                tintR * mixFactor * brightness
            );
            var g = Math.round(
              255 * brightness * (1 - mixFactor) +
                tintG * mixFactor * brightness
            );
            var b = Math.round(
              255 * brightness * (1 - mixFactor) +
                tintB * mixFactor * brightness
            );
            ctx.fillStyle = "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
          }

          ctx.fillText(char, xx, yy);
        }
      }
    }

    ctx.globalCompositeOperation = "source-over";
    frameId = requestAnimationFrame(animate);
  }

  resize();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("mousemove", onPointer, { passive: true });
  window.addEventListener(
    "touchmove",
    onPointer,
    { passive: true }
  );
  window.addEventListener("touchstart", onPointer, { passive: true });

  animate();

  window.addEventListener("beforeunload", function () {
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onPointer);
    window.removeEventListener("touchmove", onPointer);
    window.removeEventListener("touchstart", onPointer);
    if (frameId) cancelAnimationFrame(frameId);
  });
})();
