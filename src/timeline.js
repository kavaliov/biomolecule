function timeline(
  {
    containerId,
    framesFolder = "data",
    firstFrameName,
    framesCount = 0,
    fps = 24,
    autoPlay = true,
    loop = false,
    periods = {}
  }) {

  if (!containerId) {
    console.warn("Please, set containerId");
    return;
  }

  if (!firstFrameName) {
    console.warn("Please, set firstFrameName");
    return;
  }

  if (framesFolder === "data") {
    console.warn("framesFolder set by default to 'data'");
  }

  let currentFrame = 0;
  let isPlaying = false;

  const initLayout = (layoutContainer, rangeMax) => {
    const container = document.getElementById(layoutContainer);
    container.classList.add("timelineWrapper");

    // progress bar
    const progressBar = document.createElement("div");
    progressBar.classList.add("progressBar");

    // image
    const image = document.createElement("img");
    image.src = `./${framesFolder}/${firstFrameName}`;
    image.classList.add("timelineImage");

    // period title
    const periodTitle = document.createElement("div");
    periodTitle.classList.add("periodTitle");
    periodTitle.innerText = "Please wait, loading...";

    // controls wrapper
    const controlsWrapper = document.createElement("div");
    controlsWrapper.classList.add("controlsWrapper");
    controlsWrapper.classList.add("hidden");

    // play button
    const playButton = document.createElement("button");
    playButton.classList.add("playButton");
    playButton.innerText = "Play";

    // range control
    const rangeControl = document.createElement("input");
    rangeControl.classList.add("rangeControl");
    rangeControl.type = "range";
    rangeControl.value = "0";
    rangeControl.min = "0";
    rangeControl.max = String(rangeMax - 1);

    controlsWrapper.appendChild(playButton);
    controlsWrapper.appendChild(rangeControl);

    container.appendChild(periodTitle);
    container.appendChild(image);
    container.appendChild(progressBar);
    container.appendChild(controlsWrapper);

    return {image, periodTitle, progressBar, controlsWrapper, rangeControl, playButton};
  };

  const setProgressLoading = (percentage) => {
    progressBar.style.width = percentage + "%";
    periodTitle.innerText = `Please wait, loading... ${Math.ceil(100 - percentage)}%`;

    if (percentage === 0) {
      controlsWrapper.classList.remove("hidden");
      progressBar.remove();
      periodTitle.innerText = periods[0];
      if (autoPlay) playerStart();
    }
  }

  const generateFrameData = (folder = "", file = "", count = 0) => {
    const lastDotIndex = file.lastIndexOf('.');
    const name = file.substr(0, lastDotIndex - 5);
    const ext = file.substr(lastDotIndex, file.length - lastDotIndex);
    let data = [];

    for (let i = 0; i < count; i++) {
      data.push(`./${folder}/${name}.${("000" + i).slice(-4)}${ext}`);
    }

    return {data, name, ext};
  }

  const cacheImages = (frameData) => {
    if (!cacheImages.list) {
      cacheImages.list = [];
    }
    let list = cacheImages.list;
    for (let i = 0; i < frameData.length; i++) {
      let img = new Image();
      img.onload = function () {
        let index = list.indexOf(this);
        if (index !== -1) {
          list.splice(index, 1);
        }
        setProgressLoading(100 * list.length / frameData.length);
      }
      list.push(img);
      img.src = frameData[i];
    }
  }

  const setFrame = (frame) => {
    currentFrame = frame;
    rangeControl.value = frame;
    image.src = `./${framesFolder}/${fileNamePattern}.${("000" + frame).slice(-4)}${fileExt}`;
    if (periods[frame])
      periodTitle.innerText = periods[frame];
  }

  const player = () => {
    let interval;

    const start = () => {
      isPlaying = true;
      playButton.innerText = "Pause";
      interval = setInterval(() => {
        if (currentFrame < framesCount - 1) {
          currentFrame += 1;
          setFrame(currentFrame);
        } else {
          currentFrame = 0;
          if (!loop) {
            playButton.innerText = "Play";
            clearInterval(interval);
            isPlaying = false;
          }
        }
      }, 1000 / fps);
    }

    const pause = () => {
      clearInterval(interval);
      isPlaying = false;
      playButton.innerText = "Play";
    }

    return {start, pause};
  };

  const findPeriod = (arr, target) => {
    let result = 0;

    if (target >= arr[arr.length - 1]) {
      result = arr[arr.length - 1];
    }

    if (target >= arr[0] && target < arr[1]) {
      result = arr[0];
    }

    arr.forEach((frame, i) => {
      if (target >= frame && target < arr[i + 1]) {
        result = frame;
      }
    });

    return result;
  }

  const {data: frameData, name: fileNamePattern, ext: fileExt} = generateFrameData(framesFolder, firstFrameName, framesCount);
  const {image, progressBar, periodTitle, controlsWrapper, playButton, rangeControl} = initLayout(containerId, framesCount);
  const {start: playerStart, pause: playerPause} = player();
  const periodTitleFrames = Object.keys(periods).map(period => +period);
  cacheImages(frameData);

  rangeControl.addEventListener("input", function () {
    playerPause();
    setFrame(+this.value);
  })

  rangeControl.addEventListener("change", function () {
    playerPause();
    setFrame(+this.value);
    periodTitle.innerText = periods[findPeriod(periodTitleFrames, +this.value)];
  })

  playButton.addEventListener("click", function () {
    if (isPlaying) {
      playerPause();
    } else {
      playerStart();
    }
  });

  return {playerPause, playerStart};
}
