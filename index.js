if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
  document.querySelector("#FileDrop #Text").textContent = "Reading files not supported by this browser";
} else {
  const fileDrop = document.querySelector("#FileDrop")
  fileDrop.addEventListener("dragenter", () => fileDrop.classList.add("Hover"))
  fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("Hover"))
  fileDrop.addEventListener("drop", () => fileDrop.classList.remove("Hover"))
  document.querySelector("#FileDrop input").addEventListener("change", e => {
    //get the files
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0]
      document.querySelector("#FileDrop #Text").textContent = file.name;
      parseFile(file);
    }
  })
}

let blackPoint = 55 / 255;
let whitePoint = 190 / 255;

let floyd = true;
let smooth = true;
let insane = true;
let big = true;
let normalize = false;
let oklab = true;

let img = new Image();
let canvas = document.getElementById('canvas');
let ctx = cacl.createContext(canvas);

let emojiImage = new Image();
let bigEmojiImage = new Image();
let emojiImageLAB;
let emojiImageCIELAB;
let emojiImageOKLAB;
emojiImage.onload = loadEmoji;
bigEmojiImage.onload = loadBigEmoji;
emojiImage.src = 'assets/emojis5.png';
bigEmojiImage.src = 'assets/emojis.png';
let emoji = [];
let userWidth = document.getElementById('width');
let userHeight = document.getElementById('height');
let userFloyd = document.getElementById('floyd');
let userSmooth = document.getElementById('smooth');
let userInsane = document.getElementById('insane');
let userBig = document.getElementById('big');
let userNormalize = document.getElementById('normalize');
let userOklab = document.getElementById('oklab');

let progressBar = document.getElementById("bar");
let resultHTML = document.getElementById('result');

let showError = false;
let showOrder = false;

resultHTML.addEventListener('click', () => selectText(resultHTML));

let lastWidth = userWidth.value * 1;
userWidth.addEventListener('change', a => {
  if (img.src !== '') {
    if(Math.abs(lastWidth - userWidth.value) > 10) {
      let w;
      let h;
      if (userHeight.checked) {
        h = userWidth.value * 5;
        w = Math.round(h * (img.width / img.height) / 5) * 5;
      } else {
        w = userWidth.value * 5;
        h = Math.round(w * (img.height / img.width) / 5) * 5;
      }

      userBig.checked = w * h <= 640000;
      big = userBig.checked;
    }

    drawImage();
  }

  lastWidth = userWidth.value * 1;
});

userHeight.addEventListener('change', _ => {
  if (img.src !== '') {
    let w;
    let h;
    if (userHeight.checked) {
      h = userWidth.value * 5;
      w = Math.round(h * (img.width / img.height) / 5) * 5;
    } else {
      w = userWidth.value * 5;
      h = Math.round(w * (img.height / img.width) / 5) * 5;
    }

    userBig.checked = w * h <= 640000;
    big = userBig.checked;

    drawImage();
  }
});

userFloyd.addEventListener('change', _ => {
  floyd = userFloyd.checked;
  if (img.src !== '') drawImage();
});

userSmooth.addEventListener('change', _ => {
  smooth = userSmooth.checked;
  if (img.src !== '') drawImage();
});

userInsane.addEventListener('change', _ => {
  insane = userInsane.checked;
  if (img.src !== '') drawImage();
});

userBig.addEventListener('change', _ => {
  big = userBig.checked;
  if (img.src !== '') drawImage();
});

userNormalize.addEventListener('change', _ => {
  normalize = userNormalize.checked;
  if (img.src !== '') drawImage();
});

userOklab.addEventListener('change', _ => {
  oklab = userOklab.checked;
  if (img.src !== '') drawImage();
});


function loadEmoji() {
  ctx.resize(emojiImage.width, emojiImage.height);
  ctx.ctx.drawImage(emojiImage, 0, 0);
  let imgData = ctx.ctx.getImageData(0, 0, emojiImage.width, emojiImage.height);

  emojiImageOKLAB = cacl.imageDatatoLAB(imgData);
  emojiImageCIELAB = cacl.imageDatatoCIELAB(imgData);

  for (let y = 0; y < emojiImage.height; y += 5) {
    for (let x = 0; x < emojiImage.width; x += 5) {
      let isEmoji = false;
      emojiCheck:
        for (let X = 0; X < 5; X++) {
          for (let Y = 0; Y < 5; Y++) {
            let at = (x + X + (y + Y) * emojiImage.width) << 2;
            if (imgData.data[at + 0] !== 49) {
              isEmoji = true;
              break emojiCheck;
            }
            if (imgData.data[at + 1] !== 51) {
              isEmoji = true;
              break emojiCheck;
            }
            if (imgData.data[at + 2] !== 56) {
              isEmoji = true;
              break emojiCheck;
            }
          }
        }
      if (!isEmoji) continue;

      emoji.push({
        name: emojiNames[emoji.length],
        x,
        y
      });
    }
  }
  emojiImage = imgData;
  ctx.resize(100, 100);
  ctx.ctx.fillRect(0, 0, 100, 100);
}

function loadBigEmoji() {
  ctx.resize(bigEmojiImage.width, bigEmojiImage.height);
  ctx.ctx.drawImage(bigEmojiImage, 0, 0);
  bigEmojiImage = ctx.ctx.getImageData(0, 0, bigEmojiImage.width, bigEmojiImage.height);
  ctx.resize(100, 100);
  ctx.ctx.fillRect(0, 0, 100, 100);
}

function parseFile(f) {
  img.onload = _ => {
    let w;
    let h;
    if (userHeight.checked) {
      h = userWidth.value * 5;
      w = Math.round(h * (img.width / img.height) / 5) * 5;
    } else {
      w = userWidth.value * 5;
      h = Math.round(w * (img.height / img.width) / 5) * 5;
    }

    userBig.checked = w * h <= 640000;
    big = userBig.checked;

    drawImage();
  };
  img.src = URL.createObjectURL(f);
}

function sleep() {
  return new Promise(resolve => requestAnimationFrame(resolve));
}

function selectText(container) {
  if (window.getSelection) {
    let range = document.createRange();
    range.selectNode(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}

const floydPattern = [
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1],
  [2, 3, 3, 4, 4],
  [2, 3, 3, 4, 4]
];

let drawing = 0;
async function drawImage() {
  if (drawing > 1) {
    return;
  }
  drawing++;
  if (drawing > 1) {
    while (drawing > 1) {
      await sleep();
    }
  }

  if(!img.width || !img.height) {
    drawing--;
    return;
  }

  if(oklab) {
    emojiImageLAB = emojiImageOKLAB;
  }
  else {
    emojiImageLAB = emojiImageCIELAB;
  }

  document.getElementById('result').innerText = '';
  progressBar.style.width = "0%";
  progressBar.style.display = 'block';

  ctx.resize(img.width, img.height);
  if(normalize) {
    ctx.ctx.fillStyle = 'rgb(0, 0, 0)';
  }
  else {
    ctx.ctx.fillStyle = 'rgb(49, 51, 56)';
  }
  ctx.ctx.fillRect(0, 0, img.width, img.height);
  ctx.ctx.drawImage(img, 0, 0);
  let imgData = ctx.ctx.getImageData(0, 0, img.width, img.height);
  URL.revokeObjectURL(img.src);

  let w;
  let h;
  if (userHeight.checked) {
    h = userWidth.value * 5;
    w = Math.round(h * (img.width / img.height) / 5) * 5;
  } else {
    w = userWidth.value * 5;
    h = Math.round(w * (img.height / img.width) / 5) * 5;
  }

  ctx.resize(w, h);

  ctx.drawImage(imgData, 0, 0, w, h);

  if(normalize) {
    ctx.normalizeColor(blackPoint, whitePoint);
  }

  ctx.draw();

  imgData = ctx.ctx.getImageData(0, 0, w, h);
  let imgDataLAB;
  if(oklab) {
    imgDataLAB = cacl.imageDatatoLAB(imgData);
  }
  else {
    imgDataLAB = cacl.imageDatatoCIELAB(imgData);
  }
  let backupImgDataLAB;
  if(showError) {
    backupImgDataLAB = new Float64Array(imgDataLAB.length);
    backupImgDataLAB.set(imgDataLAB);
  }

  await sleep();

  let last = performance.now();

  let ans = [];

  if (insane) {
    for (let y = 0; y < h; y += 5) {
      ans.push(new Array(w / 5).fill(false));
    }

    // get closest emoji & error for each pixel
    let allError = [];
    for (let y = 0; y < h; y += 5) {
      allError.push([]);
      for (let x = 0; x < w; x += 5) {
        let best = Infinity;
        let bestID = 0;

        for (let i in emoji) {
          const e = emoji[i];
          // e.x, e.y, e.name
          let err = 0;
          for (let Y = 0; Y < 5; Y++) {
            for (let X = 0; X < 5; X++) {
              const pos = (x + X + (y + Y) * w) * 3;
              const epos = ((e.x + X) + (e.y + Y) * emojiImage.width) * 3;

              err += Math.sqrt(
                (imgDataLAB[pos + 0] - emojiImageLAB[epos + 0]) ** 2 +
                (imgDataLAB[pos + 1] - emojiImageLAB[epos + 1]) ** 2 +
                (imgDataLAB[pos + 2] - emojiImageLAB[epos + 2]) ** 2
              );
            }
          }
          if (err < best) {
            best = err;
            bestID = i;
          }
        }

        allError[allError.length - 1].push([best, bestID, [x, y]]);

        const e = emoji[bestID];

        ctx.ctx.putImageData(emojiImage, x - e.x, y - e.y, e.x, e.y, 5, 5);

        if (drawing > 1) {
          drawing--;
          return;
        }

        if (performance.now() - last > 30) {
          await sleep();
          last = performance.now();
        }
      }
    }

    ctx.draw();

    // scan through the image for the best match pixel
    let lowestError = [Infinity];
    let done = 0;
    do {
      lowestError = [Infinity];
      for (let y = 0; y < h / 5; y++) {
        for (let x = 0; x < w / 5; x++) {
          if (allError[y][x][0] < lowestError[0]) lowestError = allError[y][x];
        }
      }
      lowestError = lowestError.slice();

      // error diffuse to neighbors and apply pixel
      if (lowestError[0] < Infinity) {
        const X = lowestError[2][0];
        const Y = lowestError[2][1];

        const Xp = lowestError[2][0] / 5;
        const Yp = lowestError[2][1] / 5;

        const e = emoji[lowestError[1]];
        let globalError = [0, 0, 0];
        let validNeighbors = 0;

        let insanePattern = [
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
          [0, 0, 0, 0, 0],
        ];

        // populate insanePattern
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            // middle & out of bounds goes to everyone
            const XX = x * 4 + X - 3;
            const YY = y * 4 + Y - 3;

            if ((y === 1 && x === 1) || XX < 0 || YY < 0 || XX >= w || YY >= h) {
              continue;
            }

            // don't give to solved neighbors
            if (ans[Yp+y-1][Xp+x-1] !== false) {
              continue;
            }

            // give to corners less
            let mult;

            if(smooth) {
              mult = 1;
            } else if (x === 0 || y === 0 || x === 2 || y === 2) {
              mult = 2 / (Math.SQRT2 + 1);
            } else {
              mult = Math.SQRT2 + 2 / (Math.SQRT2 + 1);
            }

            // populate insanePattern
            for (let yy = 0; yy < 3; yy++) {
              for (let xx = 0; xx < 3; xx++) {
                insanePattern[y+yy][x+xx] += mult;
              }
            }
          }
        }

        // error diffuse to neighbors
        if(insanePattern[2][2] > 0) {
          for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
              // middle & out of bounds goes to everyone
              let XX = x * 4 + X - 3;
              let YY = y * 4 + Y - 3;
              if ((y === 1 && x === 1) || XX < 0 || YY < 0 || XX >= w || YY >= h) {
                continue;
              }

              // don't give to solved neighbors
              if (ans[Yp+y-1][Xp+x-1] !== false) {
                continue;
              }

              if(floyd) {
                XX = x * 3 + X - 2;
                YY = y * 3 + Y - 2;
              }

              // give to corners less
              let mult;

              if(smooth) {
                mult = 1;
              } else if (x === 0 || y === 0 || x === 2 || y === 2) {
                mult = 2 / (Math.SQRT2 + 1);
              } else {
                mult = Math.SQRT2 + 2 / (Math.SQRT2 + 1);
              }

              // 3x3 windows
              let err = [0, 0, 0];
              let count = 0;
              for (let yy = 0; yy < 3; yy++) {
                for (let xx = 0; xx < 3; xx++) {
                  if(XX + xx < 0 || YY + yy < 0 || XX + xx >= 5 || YY + yy >= 5) count++;

                  const pos = (x + xx + X + (y + yy + Y) * w) * 3;
                  const epos = ((e.x + xx) + (e.y + yy) * emojiImage.width) * 3;
                  err[0] += mult * (imgDataLAB[pos + 0] - emojiImageLAB[epos + 0]) / insanePattern[y + yy][x + xx];
                  err[1] += mult * (imgDataLAB[pos + 1] - emojiImageLAB[epos + 1]) / insanePattern[y + yy][x + xx];
                  err[2] += mult * (imgDataLAB[pos + 2] - emojiImageLAB[epos + 2]) / insanePattern[y + yy][x + xx];
                }
              }

              err[0] /= count;
              err[1] /= count;
              err[2] /= count;

              for (let yy = 0; yy < 3; yy++) {
                for (let xx = 0; xx < 3; xx++) {
                  // only if it's not within the original emoji
                  if(XX + xx < 0 || YY + yy < 0 || XX + xx >= 5 || YY + yy >= 5) {
                    const pos = (XX + xx + (YY + yy) * w) * 3;

                    imgDataLAB[pos + 0] += err[0];
                    imgDataLAB[pos + 1] += err[1];
                    imgDataLAB[pos + 2] += err[2];
                  }
                }
              }
            }
          }

          // subtract used error
          for(let y = 0; y < 5; y++) {
            for(let x = 0; x < 5; x++) {
              if(insanePattern[y][x] === 0) continue;

              const pos = (X + x + (Y + y) * w) * 3;
              const epos = ((e.x + x) + (e.y + y) * emojiImage.width) * 3;

              imgDataLAB[pos + 0] = emojiImageLAB[epos + 0];
              imgDataLAB[pos + 1] = emojiImageLAB[epos + 1];
              imgDataLAB[pos + 2] = emojiImageLAB[epos + 2];
            }
          }

          // recalculate neighbors
          for (let y = 0; y < 3; y++) {
            for (let x = 0; x < 3; x++) {
              const XX = x * 5 + X - 5;
              const YY = y * 5 + Y - 5;

              // skip self and out of bounds
              if ((y === 1 && x === 1) || XX < 0 || YY < 0 || XX >= w || YY >= h) {
                continue;
              }

              if(ans[Yp+y-1][Xp+x-1] !== false) {
                continue;
              }

              // recalculate emoji
              const X_ = x * 5 + X - 5;
              const Y_ = y * 5 + Y - 5;

              let best = Infinity;
              let bestID = 0;

              for (let i in emoji) {
                const e = emoji[i];
                // e.x, e.y, e.name
                let err = 0;
                for (let yy = 0; yy < 5; yy++) {
                  for (let xx = 0; xx < 5; xx++) {
                    const pos = (X_ + xx + (Y_ + yy) * w) * 3;
                    const epos = ((e.x + xx) + (e.y + yy) * emojiImage.width) * 3;

                    err += Math.sqrt(
                      (imgDataLAB[pos + 0] - emojiImageLAB[epos + 0]) ** 2 +
                      (imgDataLAB[pos + 1] - emojiImageLAB[epos + 1]) ** 2 +
                      (imgDataLAB[pos + 2] - emojiImageLAB[epos + 2]) ** 2
                    );
                  }
                }

                if (err < best) {
                  best = err;
                  bestID = i;
                }
              }

              allError[Yp + y - 1][Xp + x - 1] = [best, bestID, allError[Yp + y - 1][Xp + x - 1][2]];
            }
          }

        }

        allError[Yp][Xp][0] = Infinity;

        if(showOrder) {
          const progress = done / (w/5 * (h/5));
          ctx.fillStyle = cacl.hslToRgb({h: progress, s: 1, l: progress});

          ctx.fillRect(X, Y, 5, 5);
          ctx.draw();
        }
        else {
          ctx.ctx.putImageData(emojiImage, X - e.x, Y - e.y, e.x, e.y, 5, 5);
        }
        ans[Yp][Xp] = lowestError[1];
      }

      if (drawing > 1) {
        drawing--;
        return;
      }

      done++;

      if (performance.now() - last > 30) {

        progressBar.style.width = (done / (w/5 * (h/5))) * 100 + "%";
        await sleep();
        last = performance.now();
      }

    } while (lowestError[0] < Infinity);
  } else {
    for (let y = 0; y < h; y += 5) {
      ans.push([]);
      for (let x = 0; x < w; x += 5) {
        let best = Infinity;
        let bestID = 0;

        for (let i in emoji) {
          const e = emoji[i];
          // e.x, e.y, e.name
          let err = 0;
          for (let Y = 0; Y < 5; Y++) {
            for (let X = 0; X < 5; X++) {
              let pos = (x + X + (y + Y) * w) * 3;
              let epos = ((e.x + X) + (e.y + Y) * emojiImage.width) * 3;

              err += Math.sqrt(
                (imgDataLAB[pos + 0] - emojiImageLAB[epos + 0]) ** 2 +
                (imgDataLAB[pos + 1] - emojiImageLAB[epos + 1]) ** 2 +
                (imgDataLAB[pos + 2] - emojiImageLAB[epos + 2]) ** 2
              );
            }
          }
          if (err < best) {
            best = err;
            bestID = i;
          }
        }

        if (floyd) {
          // get floydError
          let err = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0]
          ];

          for (let Y = 0; Y < 5; Y++) {
            for (let X = 0; X < 5; X++) {
              const pos = (x + X + (y + Y) * w) * 3;
              const epos = ((emoji[bestID].x + X) + (emoji[bestID].y + Y) * emojiImage.width) * 3;

              err[floydPattern[Y][X]][0] += imgDataLAB[pos + 0] - emojiImageLAB[epos + 0];
              err[floydPattern[Y][X]][1] += imgDataLAB[pos + 1] - emojiImageLAB[epos + 1];
              err[floydPattern[Y][X]][2] += imgDataLAB[pos + 2] - emojiImageLAB[epos + 2];
            }
          }

          // spread error
          err[0][0] *= 1 / 9 * (9 / 25) / 16;
          err[0][1] *= 1 / 9 * (9 / 25) / 16;
          err[0][2] *= 1 / 9 * (9 / 25) / 16;
          err[1][0] *= 1 / 6;
          err[1][1] *= 1 / 6;
          err[1][2] *= 1 / 6;
          err[2][0] *= 1 / 2 * (2 / 4);
          err[2][1] *= 1 / 2 * (2 / 4);
          err[2][2] *= 1 / 2 * (2 / 4);
          err[3][0] *= 1 / 4 * (4 / 8);
          err[3][1] *= 1 / 4 * (4 / 8);
          err[3][2] *= 1 / 4 * (4 / 8);
          err[4][0] *= 1 / 4;
          err[4][1] *= 1 / 4;
          err[4][2] *= 1 / 4;

          for (let Y = 0; Y < 2; Y++) {
            let pos = (x + Y + y * w) * 3;

            if (x + 5 < w) {
              imgDataLAB[(5 + 2 * w) * 3 + pos + 0] += err[1][0];
              imgDataLAB[(5 + 2 * w) * 3 + pos + 1] += err[1][1];
              imgDataLAB[(5 + 2 * w) * 3 + pos + 2] += err[1][2];
            }

            for (let X = 0; X < 2; X++) {
              pos = (x + X + (y + Y) * w) * 3;

              if (x + 5 < w) {
                imgDataLAB[5 * 3 + pos + 0] += err[1][0];
                imgDataLAB[5 * 3 + pos + 1] += err[1][1];
                imgDataLAB[5 * 3 + pos + 2] += err[1][2];

                imgDataLAB[(5 + 3 * w) * 3 + pos + 0] += err[4][0];
                imgDataLAB[(5 + 3 * w) * 3 + pos + 1] += err[4][1];
                imgDataLAB[(5 + 3 * w) * 3 + pos + 2] += err[4][2];
              }

              if (y + 5 < h) {
                if (x - 5 >= 0) {
                  imgDataLAB[(-2 + 5 * w) * 3 + pos + 0] += err[2][0];
                  imgDataLAB[(-2 + 5 * w) * 3 + pos + 1] += err[2][1];
                  imgDataLAB[(-2 + 5 * w) * 3 + pos + 2] += err[2][2];
                }

                imgDataLAB[(5 * w) * 3 + pos + 0] += err[3][0];
                imgDataLAB[(5 * w) * 3 + pos + 1] += err[3][1];
                imgDataLAB[(5 * w) * 3 + pos + 2] += err[3][2];

                imgDataLAB[(2 + 5 * w) * 3 + pos + 0] += err[3][0];
                imgDataLAB[(2 + 5 * w) * 3 + pos + 1] += err[3][1];
                imgDataLAB[(2 + 5 * w) * 3 + pos + 2] += err[3][2];
              }
            }
          }

          if (smooth) {
            for (let Y = 0; Y < 5; Y++) {
              for (let X = 0; X < 5; X++) {
                const pos = (x + X + (y + Y) * w) * 3;

                if (x + 5 < w) {
                  imgDataLAB[5 * 3 + pos + 0] += err[0][0] * 7;
                  imgDataLAB[5 * 3 + pos + 1] += err[0][1] * 7;
                  imgDataLAB[5 * 3 + pos + 2] += err[0][2] * 7;
                }

                if (y + 5 < h) {
                  if (x - 5 >= 0) {
                    imgDataLAB[(-5 + 5 * w) * 3 + pos + 0] += err[0][0] * 3;
                    imgDataLAB[(-5 + 5 * w) * 3 + pos + 1] += err[0][1] * 3;
                    imgDataLAB[(-5 + 5 * w) * 3 + pos + 2] += err[0][2] * 3;
                  }

                  imgDataLAB[(5 * w) * 3 + pos + 0] += err[0][0] * 5;
                  imgDataLAB[(5 * w) * 3 + pos + 1] += err[0][1] * 5;
                  imgDataLAB[(5 * w) * 3 + pos + 2] += err[0][2] * 5;

                  if (x + 5 < w) {
                    imgDataLAB[(5 + 5 * w) * 3 + pos + 0] += err[0][0];
                    imgDataLAB[(5 + 5 * w) * 3 + pos + 1] += err[0][1];
                    imgDataLAB[(5 + 5 * w) * 3 + pos + 2] += err[0][2];
                  }
                }
              }
            }
          }

          // fix out-of-bounds
          //*

          if(oklab) {
            for (let Y = 0; Y < 10; Y++) {
              for (let X = -5; X < 10; X++) {
                const pos = (x + X + (y + Y) * w) * 3;

                if (imgDataLAB[pos + 0] < 0) imgDataLAB[pos + 0] = 0;
                else if (imgDataLAB[pos + 0] > 1) imgDataLAB[pos + 0] = 1;

                if (imgDataLAB[pos + 1] < -0.4) imgDataLAB[pos + 1] = -0.4;
                else if (imgDataLAB[pos + 1] > 0.4) imgDataLAB[pos + 1] = 0.4;

                if (imgDataLAB[pos + 2] < -0.4) imgDataLAB[pos + 2] = -0.4;
                else if (imgDataLAB[pos + 2] > 0.4) imgDataLAB[pos + 2] = 0.4;
              }
            }
          }
          else {
            for (let Y = 0; Y < 10; Y++) {
              for (let X = -5; X < 10; X++) {
                const pos = (x + X + (y + Y) * w) * 3;

                if (imgDataLAB[pos + 0] < 0) imgDataLAB[pos + 0] = 0;
                else if (imgDataLAB[pos + 0] > 9) imgDataLAB[pos + 0] = 9;

                if (imgDataLAB[pos + 1] < -13.2) imgDataLAB[pos + 1] = -13.2;
                else if (imgDataLAB[pos + 1] > 13.2) imgDataLAB[pos + 1] = 13.2;

                if (imgDataLAB[pos + 2] < -12.5) imgDataLAB[pos + 2] = -12.5;
                else if (imgDataLAB[pos + 2] > 12.5) imgDataLAB[pos + 2] = 12.5;
              }
            }
          }
          //*/
        } else if (smooth) {
          // get floydError
          let err = [0, 0, 0];

          for (let Y = 0; Y < 5; Y++) {
            for (let X = 0; X < 5; X++) {
              const pos = (x + X + (y + Y) * w) * 3;
              const epos = ((emoji[bestID].x + X) + (emoji[bestID].y + Y) * emojiImage.width) * 3;

              err[0] += imgDataLAB[pos + 0] - emojiImageLAB[epos + 0];
              err[1] += imgDataLAB[pos + 1] - emojiImageLAB[epos + 1];
              err[2] += imgDataLAB[pos + 2] - emojiImageLAB[epos + 2];
            }
          }

          // spread error
          err[0] *= 1 / 25 / 16;
          err[1] *= 1 / 25 / 16;
          err[2] *= 1 / 25 / 16;

          for (let Y = 0; Y < 5; Y++) {
            for (let X = 0; X < 5; X++) {
              const pos = (x + X + (y + Y) * w) * 3;

              if (x + 5 < w) {
                imgDataLAB[5 * 3 + pos + 0] += err[0] * 7;
                imgDataLAB[5 * 3 + pos + 1] += err[1] * 7;
                imgDataLAB[5 * 3 + pos + 2] += err[2] * 7;
              }

              if (y + 5 < h) {
                if (x - 5 >= 0) {
                  imgDataLAB[(-5 + 5 * w) * 3 + pos + 0] += err[0] * 3;
                  imgDataLAB[(-5 + 5 * w) * 3 + pos + 1] += err[1] * 3;
                  imgDataLAB[(-5 + 5 * w) * 3 + pos + 2] += err[2] * 3;
                }

                imgDataLAB[(5 * w) * 3 + pos + 0] += err[0] * 5;
                imgDataLAB[(5 * w) * 3 + pos + 1] += err[1] * 5;
                imgDataLAB[(5 * w) * 3 + pos + 2] += err[2] * 5;

                if (x + 5 < w) {
                  imgDataLAB[(5 + 5 * w) * 3 + pos + 0] += err[0];
                  imgDataLAB[(5 + 5 * w) * 3 + pos + 1] += err[1];
                  imgDataLAB[(5 + 5 * w) * 3 + pos + 2] += err[2];
                }
              }
            }
          }

          // fix out-of-bounds
          //*
          if(oklab) {
            for (let Y = 0; Y < 10; Y++) {
              for (let X = -5; X < 10; X++) {
                const pos = (x + X + (y + Y) * w) * 3;

                if (imgDataLAB[pos + 0] < 0) imgDataLAB[pos + 0] = 0;
                else if (imgDataLAB[pos + 0] > 1) imgDataLAB[pos + 0] = 1;

                if (imgDataLAB[pos + 1] < -0.4) imgDataLAB[pos + 1] = -0.4;
                else if (imgDataLAB[pos + 1] > 0.4) imgDataLAB[pos + 1] = 0.4;

                if (imgDataLAB[pos + 2] < -0.4) imgDataLAB[pos + 2] = -0.4;
                else if (imgDataLAB[pos + 2] > 0.4) imgDataLAB[pos + 2] = 0.4;
              }
            }
          }
          else {
            for (let Y = 0; Y < 10; Y++) {
              for (let X = -5; X < 10; X++) {
                const pos = (x + X + (y + Y) * w) * 3;

                if (imgDataLAB[pos + 0] < 0) imgDataLAB[pos + 0] = 0;
                else if (imgDataLAB[pos + 0] > 9) imgDataLAB[pos + 0] = 9;

                if (imgDataLAB[pos + 1] < -13.2) imgDataLAB[pos + 1] = -13.2;
                else if (imgDataLAB[pos + 1] > 13.2) imgDataLAB[pos + 1] = 13.2;

                if (imgDataLAB[pos + 2] < -12.5) imgDataLAB[pos + 2] = -12.5;
                else if (imgDataLAB[pos + 2] > 12.5) imgDataLAB[pos + 2] = 12.5;
              }
            }
          }
          //*/
        }

        if(showOrder) {
          const progress = (y + (x / w)) / h;
          ctx.fillStyle = cacl.hslToRgb({h: progress, s: 1, l: progress});

          ctx.fillRect(x, y, 5, 5);
          ctx.draw();
        }
        else {
          ctx.ctx.putImageData(emojiImage, x - emoji[bestID].x, y - emoji[bestID].y, emoji[bestID].x, emoji[bestID].y, 5, 5);
        }

        ans[ans.length - 1].push(bestID);

        if (drawing > 1) {
          drawing--;
          return;
        }

        if (performance.now() - last > 30) {
          progressBar.style.width = (y + (x / w)) / h * 100 + "%";
          await sleep();
          last = performance.now();
        }
      }
    }
  }

  // print result
  if(showOrder) {}
  else if(showError) {
    let local = 0;
    let total = [0, 0, 0];
    for(let y = 0; y < h; y += 5) {
      for(let x = 0; x < w; x += 5) {
        let e = emoji[ans[y/5][x/5]];
        for(let Y = 0; Y < 5; Y++) {
          for(let X = 0; X < 5; X++) {
            const pos = (x + X + (y + Y) * w) * 3;
            const epos = ((e.x + X) + (e.y + Y) * emojiImage.width) * 3;

            let err = Math.sqrt(
              (backupImgDataLAB[pos + 0] - emojiImageLAB[epos + 0]) ** 2 +
              (backupImgDataLAB[pos + 1] - emojiImageLAB[epos + 1]) ** 2 +
              (backupImgDataLAB[pos + 2] - emojiImageLAB[epos + 2]) ** 2
            );
            local += err;

            total[0] += backupImgDataLAB[pos + 0] - emojiImageLAB[epos + 0];
            total[1] += backupImgDataLAB[pos + 1] - emojiImageLAB[epos + 1];
            total[2] += backupImgDataLAB[pos + 2] - emojiImageLAB[epos + 2];

            err /= 1.7320508075688772;

            ctx.fillStyle = {r: err, g: err, b: err, a: 1};
            ctx.point(X + x, Y + y);
          }
        }
      }
    }

    total = Math.sqrt(total[0] ** 2 + total[1] ** 2 + total[2] ** 2);

    console.log('average local error:', local / (h / 5 * (w / 5)));
    console.log('global error:', total / (h / 5 * (w / 5)));
    ctx.draw();
  }
  else {

    if (w * h < 25000) {
      const txt = ans.map(a => a.map(b => emoji[b].name).join('')).join('\n');
      console.log(txt);
      resultHTML.innerText = txt;
      selectText(resultHTML);
      await sleep();
    }

    if(big) {
      ctx.resize(w / 5 * 22, h / 5 * 22);
      for (let y = 0; y < ans.length; y++) {
        for (let x = 0; x < ans[0].length; x++) {
          ctx.ctx.putImageData(bigEmojiImage, x * 22 - emoji[ans[y][x]].x / 5 * 22, y * 22 - emoji[ans[y][x]].y / 5 * 22, emoji[ans[y][x]].x / 5 * 22, emoji[ans[y][x]].y / 5 * 22, 22, 22);
        }
      }
    }
  }

  drawing--;

  progressBar.style.display = 'none';
}

//ctx.ctx
