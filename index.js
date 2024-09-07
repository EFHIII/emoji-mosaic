if(!(window.File && window.FileReader && window.FileList && window.Blob)) {
  document.querySelector("#FileDrop #Text").textContent = "Reading files not supported by this browser";
} else {
  const fileDrop = document.querySelector("#FileDrop")
  fileDrop.addEventListener("dragenter", () => fileDrop.classList.add("Hover"))
  fileDrop.addEventListener("dragleave", () => fileDrop.classList.remove("Hover"))
  fileDrop.addEventListener("drop", () => fileDrop.classList.remove("Hover"))
  document.querySelector("#FileDrop input").addEventListener("change", e => {
    //get the files
    const files = e.target.files;
    if(files.length > 0) {
      const file = files[0]
      document.querySelector("#FileDrop #Text").textContent = file.name;
      parseFile(file);
    }
  })
}

let floyd = true;

let img = new Image();
let canvas = document.getElementById('canvas');
let ctx = cacl.createContext(canvas);

let emojiImage = new Image();
let emojiImageLAB;
emojiImage.onload = loadEmoji;
emojiImage.src = 'assets/emojis.png';
let emoji = [];
let userWidth = document.getElementById('width');
let userHeight = document.getElementById('height');
let userFloyd = document.getElementById('floyd');

let resultHTML = document.getElementById('result');

resultHTML.addEventListener('click', () => selectText(resultHTML));

userWidth.addEventListener('change', _ => {
  if(img.src !== '') drawImage();
});

userHeight.addEventListener('change', _ => {
  if(img.src !== '') drawImage();
});

userFloyd.addEventListener('change', _ => {
  floyd = userFloyd.checked;
  if(img.src !== '') drawImage();
});


function loadEmoji() {
  ctx.resize(emojiImage.width, emojiImage.height);
  ctx.ctx.drawImage(emojiImage, 0, 0);
  let imgData = ctx.ctx.getImageData(0, 0, emojiImage.width, emojiImage.height);
  emojiImageLAB = cacl.imageDatatoLAB(imgData);
  for(let y = 0; y < emojiImage.height; y += 22) {
    for(let x = 0; x < emojiImage.width; x += 22) {
      let isEmoji = false;
      emojiCheck:
      for(let X = 0; X < 22; X++) {
        for(let Y = 0; Y < 22; Y++) {
          let at = (x + X + (y + Y) * emojiImage.width) << 2;
          if(imgData.data[at + 0] !== 49) {isEmoji = true; break emojiCheck;}
          if(imgData.data[at + 1] !== 51) {isEmoji = true; break emojiCheck;}
          if(imgData.data[at + 2] !== 56) {isEmoji = true; break emojiCheck;}
        }
      }
      if(!isEmoji) continue;

      emoji.push({
        name: emojiNames[emoji.length],
        x, y
      });
    }
  }
  emojiImage = imgData;
  ctx.resize(100, 100);
  ctx.ctx.fillRect(0, 0, 100, 100);
}

function parseFile(f) {
  img.onload = drawImage;
  img.src = URL.createObjectURL(f);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function selectText(container) {
  if (window.getSelection) {
    let range = document.createRange();
    range.selectNode(container);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}

let drawing = false;
async function drawImage() {
  if(drawing) {
    drawing = false;
    while(!drawing) {
      await sleep(10);
    }
  }
  document.getElementById('result').innerText = '';
  drawing = true;

  ctx.resize(img.width, img.height);
  ctx.ctx.fillStyle = 'rgb(49, 51, 56)';
  ctx.ctx.fillRect(0, 0, img.width, img.height);
  ctx.ctx.drawImage(img, 0, 0);
  let imgData = ctx.ctx.getImageData(0, 0, img.width, img.height);
  URL.revokeObjectURL(img.src);

  let w;
  let h;
  if(userHeight.checked) {
    h = userWidth.value * 22;
    w = Math.round(h * (img.width / img.height) / 22) * 22;
  }
  else {
    w = userWidth.value * 22;
    h = Math.round(w * (img.height / img.width) / 22) * 22;
  }

  ctx.resize(w, h);

  ctx.drawImage(imgData, 0, 0, w, h);
  ctx.draw();

  imgData = ctx.ctx.getImageData(0, 0, w, h);
  let imgDataLAB = cacl.imageDatatoLAB(imgData);

  await sleep(0);

  let last = performance.now();

  let txt = '';

  for(let y = 0; y < h; y += 22) {
    for(let x = 0; x < w; x += 22) {
      let best = Infinity;
      let bestID = 0;

      for(let i in emoji) {
        let e = emoji[i];
        // e.x, e.y, e.name
        let err = 0;
        for(let Y = 0; Y < 22; Y++) {
          for(let X = 0; X < 22; X++) {
            let pos = (x + X + (y + Y) * w) * 3;
            let epos = ((e.x + X) + (e.y + Y) * emojiImage.width) * 3;

            err += Math.sqrt(
              (imgDataLAB[pos + 0] - emojiImageLAB[epos + 0]) ** 2 +
              (imgDataLAB[pos + 1] - emojiImageLAB[epos + 1]) ** 2 +
              (imgDataLAB[pos + 2] - emojiImageLAB[epos + 2]) ** 2
            );
          }
        }
        if(err < best) {
          best = err;
          bestID = i;
        }
      }

      if(floyd) {
        // get floydError
        let err = [0, 0, 0];

        for(let Y = 0; Y < 22; Y++) {
          for(let X = 0; X < 22; X++) {
            let pos = (x + X + (y + Y) * w) * 3;
            let epos = ((emoji[bestID].x + X) + (emoji[bestID].y + Y) * emojiImage.width) * 3;

            err[0] += imgDataLAB[pos + 0] - emojiImageLAB[epos + 0];
            err[1] += imgDataLAB[pos + 1] - emojiImageLAB[epos + 1];
            err[2] += imgDataLAB[pos + 2] - emojiImageLAB[epos + 2];
          }
        }

        // spread error
        err[0] /= 22 * 22;
        err[1] /= 22 * 22;
        err[2] /= 22 * 22;

        for(let Y = 0; Y < 11; Y++) {
          for(let X = 0; X < 11; X++) {
            let pos = (x + X + (y + Y) * w) * 3;

            if(x + 22 < w) {
              imgDataLAB[22*3 + pos + 0] += err[0] * 14 / 16;
              imgDataLAB[22*3 + pos + 1] += err[1] * 14 / 16;
              imgDataLAB[22*3 + pos + 2] += err[2] * 14 / 16;

              imgDataLAB[11*w*3 + 22*3 + pos + 0] += err[0] * 14 / 16;
              imgDataLAB[11*w*3 + 22*3 + pos + 1] += err[1] * 14 / 16;
              imgDataLAB[11*w*3 + 22*3 + pos + 2] += err[2] * 14 / 16;
            }

            if(y + 22 < h) {
              if(x - 22 >= 0) {
                imgDataLAB[22*w*3 - 22*3 + pos + 0] += err[0] * 12 / 16;
                imgDataLAB[22*w*3 - 22*3 + pos + 1] += err[1] * 12 / 16;
                imgDataLAB[22*w*3 - 22*3 + pos + 2] += err[2] * 12 / 16;
              }

              imgDataLAB[22*w*3 + pos + 0] += err[0] * 10 / 16;
              imgDataLAB[22*w*3 + pos + 1] += err[1] * 10 / 16;
              imgDataLAB[22*w*3 + pos + 2] += err[2] * 10 / 16;

              imgDataLAB[22*w*3 + 11*3 + pos + 0] += err[0] * 10 / 16;
              imgDataLAB[22*w*3 + 11*3 + pos + 1] += err[1] * 10 / 16;
              imgDataLAB[22*w*3 + 11*3 + pos + 2] += err[2] * 10 / 16;

              if(x + 22 < w) {
                imgDataLAB[22*w*3 + 22*3 + pos + 0] += err[0] * 4 / 16;
                imgDataLAB[22*w*3 + 22*3 + pos + 1] += err[1] * 4 / 16;
                imgDataLAB[22*w*3 + 22*3 + pos + 2] += err[2] * 4 / 16;
              }
            }
          }
        }

        // fix out-of-bounds
        for(let Y = 0; Y < 44; Y++) {
          for(let X = -22; X < 44; X++) {
            let pos = (x + X + (y + Y) * w) * 3;

            if(imgDataLAB[pos + 0] < 0) imgDataLAB[pos + 0] = 0;
            if(imgDataLAB[pos + 0] > 9) imgDataLAB[pos + 0] = 9;

            if(imgDataLAB[pos + 1] < -13.2) imgDataLAB[pos + 1] = -13.2;
            if(imgDataLAB[pos + 1] > 13.2) imgDataLAB[pos + 1] = 13.2;

            if(imgDataLAB[pos + 2] < -12.5) imgDataLAB[pos + 2] = -12.5;
            if(imgDataLAB[pos + 2] > 12.5) imgDataLAB[pos + 2] = 12.5;
          }
        }
      }

      ctx.ctx.putImageData(emojiImage, x - emoji[bestID].x, y - emoji[bestID].y, emoji[bestID].x, emoji[bestID].y, 22, 22);

      txt += emoji[bestID].name;

      if(!drawing) {
        drawing = true;
        return;
      }

      if(performance.now() - last > 30) {
        await sleep(0);
        last = performance.now();
      }
    }
    txt += '\n';
  }
  console.log(txt);
  resultHTML.innerText = txt;
  selectText(resultHTML);
  drawing = false;
}

//ctx.ctx
