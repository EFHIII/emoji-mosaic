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
let bigEmojiImage = new Image();
let emojiImageLAB;
emojiImage.onload = loadEmoji;
bigEmojiImage.onload = loadBigEmoji;
emojiImage.src = 'assets/emojis5.png';
bigEmojiImage.src = 'assets/emojis.png';
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
  for(let y = 0; y < emojiImage.height; y += 5) {
    for(let x = 0; x < emojiImage.width; x += 5) {
      let isEmoji = false;
      emojiCheck:
      for(let X = 0; X < 5; X++) {
        for(let Y = 0; Y < 5; Y++) {
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

function loadBigEmoji() {
  ctx.resize(bigEmojiImage.width, bigEmojiImage.height);
  ctx.ctx.drawImage(bigEmojiImage, 0, 0);
  bigEmojiImage = ctx.ctx.getImageData(0, 0, bigEmojiImage.width, bigEmojiImage.height);
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

const floydPattern = [
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1],
  [0, 0, 0, 1, 1],
  [2, 3, 3, 4, 4],
  [2, 3, 3, 4, 4]
];

let drawing = 0;
async function drawImage() {
  drawing++;
  if(drawing > 1) {
    while(drawing > 1) {
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
    h = userWidth.value * 5;
    w = Math.round(h * (img.width / img.height) / 5) * 5;
  }
  else {
    w = userWidth.value * 5;
    h = Math.round(w * (img.height / img.width) / 5) * 5;
  }

  ctx.resize(w, h);

  ctx.drawImage(imgData, 0, 0, w, h);
  ctx.draw();

  imgData = ctx.ctx.getImageData(0, 0, w, h);
  let imgDataLAB = cacl.imageDatatoLAB(imgData);

  await sleep(0);

  let last = performance.now();

  let ans = [];

  for(let y = 0; y < h; y += 5) {
    ans.push([]);
    for(let x = 0; x < w; x += 5) {
      let best = Infinity;
      let bestID = 0;

      for(let i in emoji) {
        let e = emoji[i];
        // e.x, e.y, e.name
        let err = 0;
        for(let Y = 0; Y < 5; Y++) {
          for(let X = 0; X < 5; X++) {
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
        let err = [
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0],
          [0, 0, 0]
        ];

        for(let Y = 0; Y < 5; Y++) {
          for(let X = 0; X < 5; X++) {
            let pos = (x + X + (y + Y) * w) * 3;
            let epos = ((emoji[bestID].x + X) + (emoji[bestID].y + Y) * emojiImage.width) * 3;

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
        err[3][0] *= 1 / 4;
        err[3][1] *= 1 / 4;
        err[3][2] *= 1 / 4;
        err[4][0] *= 1 / 4 * (4 / 12);
        err[4][1] *= 1 / 4 * (4 / 12);
        err[4][2] *= 1 / 4 * (4 / 12);

        for(let Y = 0; Y < 2; Y++) {
          let pos = (x + Y + y * w) * 3;

          if(x + 5 < w) {
            imgDataLAB[(5 + 2*w)*3 + pos + 0] += err[1][0];
            imgDataLAB[(5 + 2*w)*3 + pos + 1] += err[1][1];
            imgDataLAB[(5 + 2*w)*3 + pos + 2] += err[1][2];
          }

          pos = (x + (y + Y) * w) * 3;
          if(y + 5 < h) {
            imgDataLAB[(5*w)*3 + pos + 0] += err[2][0];
            imgDataLAB[(5*w)*3 + pos + 1] += err[2][1];
            imgDataLAB[(5*w)*3 + pos + 2] += err[2][2];

            if(x - 5 >= 0) {
              imgDataLAB[(-1 + 5*w)*3 + pos + 0] += err[2][0];
              imgDataLAB[(-1 + 5*w)*3 + pos + 1] += err[2][1];
              imgDataLAB[(-1 + 5*w)*3 + pos + 2] += err[2][2];
            }
          }

          for(let X = 0; X < 2; X++) {
            pos = (x + X + (y + Y) * w) * 3;

            if(x + 5 < w) {
              imgDataLAB[5*3 + pos + 0] += err[1][0];
              imgDataLAB[5*3 + pos + 1] += err[1][1];
              imgDataLAB[5*3 + pos + 2] += err[1][2];

              imgDataLAB[(5 + 3*w)*3 + pos + 0] += err[4][0];
              imgDataLAB[(5 + 3*w)*3 + pos + 1] += err[4][1];
              imgDataLAB[(5 + 3*w)*3 + pos + 2] += err[4][2];
            }

            if(y + 5 < h) {
              imgDataLAB[(1 + 5*w)*3 + pos + 0] += err[3][0];
              imgDataLAB[(1 + 5*w)*3 + pos + 1] += err[3][1];
              imgDataLAB[(1 + 5*w)*3 + pos + 2] += err[3][2];

              imgDataLAB[(3 + 5*w)*3 + pos + 0] += err[4][0];
              imgDataLAB[(3 + 5*w)*3 + pos + 1] += err[4][1];
              imgDataLAB[(3 + 5*w)*3 + pos + 2] += err[4][2];

              if(x + 5 < w) {
                imgDataLAB[(5 + 5*w)*3 + pos + 0] += err[4][0];
                imgDataLAB[(5 + 5*w)*3 + pos + 1] += err[4][1];
                imgDataLAB[(5 + 5*w)*3 + pos + 2] += err[4][2];
              }
            }
          }
        }

        for(let Y = 0; Y < 5; Y++) {
          for(let X = 0; X < 5; X++) {
            let pos = (x + X + (y + Y) * w) * 3;

            if(x + 5 < w) {
              imgDataLAB[5*3 + pos + 0] += err[0][0] * 7;
              imgDataLAB[5*3 + pos + 1] += err[0][1] * 7;
              imgDataLAB[5*3 + pos + 2] += err[0][2] * 7;
            }

            if(y + 5 < h) {
              if(x - 5 >= 0) {
                imgDataLAB[(-5 + 5*w)*3 + pos + 0] += err[0][0] * 3;
                imgDataLAB[(-5 + 5*w)*3 + pos + 1] += err[0][1] * 3;
                imgDataLAB[(-5 + 5*w)*3 + pos + 2] += err[0][2] * 3;
              }

              imgDataLAB[(5*w)*3 + pos + 0] += err[0][0] * 5;
              imgDataLAB[(5*w)*3 + pos + 1] += err[0][1] * 5;
              imgDataLAB[(5*w)*3 + pos + 2] += err[0][2] * 5;

              if(x + 5 < w) {
                imgDataLAB[(5 + 5*w)*3 + pos + 0] += err[0][0];
                imgDataLAB[(5 + 5*w)*3 + pos + 1] += err[0][1];
                imgDataLAB[(5 + 5*w)*3 + pos + 2] += err[0][2];
              }
            }
          }
        }

        // fix out-of-bounds
        for(let Y = 0; Y < 10; Y++) {
          for(let X = -5; X < 10; X++) {
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

      ctx.ctx.putImageData(emojiImage, x - emoji[bestID].x, y - emoji[bestID].y, emoji[bestID].x, emoji[bestID].y, 5, 5);

      ans[ans.length-1].push(bestID);

      if(drawing > 1) {
        drawing--;
        return;
      }

      if(performance.now() - last > 30) {
        await sleep(0);
        last = performance.now();
      }
    }
  }

  if(w * h < 25000) {
    let txt = ans.map(a=>a.map(b=>emoji[b].name).join('')).join('\n');
    console.log(txt);
    resultHTML.innerText = txt;
    selectText(resultHTML);
    await sleep(0);
  }

  if(w * h < 640000) {
    ctx.resize(w/5*22, h/5*22);
    for(let y = 0; y < ans.length; y++) {
      for(let x = 0; x < ans[0].length; x++) {
        ctx.ctx.putImageData(bigEmojiImage, x * 22 - emoji[ans[y][x]].x/5*22, y * 22 - emoji[ans[y][x]].y/5*22, emoji[ans[y][x]].x/5*22, emoji[ans[y][x]].y/5*22, 22, 22);
      }
    }
  }
  drawing--;
}

//ctx.ctx
