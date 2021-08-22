let count = 0;

setInterval(async () => {
  try {
    await fetch(process.env.apiUrl);
    console.log(++count + " kept api alive")
  } catch {
    console.log(++count + " error keeping api alive")
  }
}, 5 * 60 * 1000);