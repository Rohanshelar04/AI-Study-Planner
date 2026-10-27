function timeToMinutes(time) {
  // Check if input is a string and contains a colon
  if (typeof time !== 'string' || !time.includes(':')) {
    return 0; // Or throw an error, depending on your needs
  }

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}


function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}


module.exports = { timeToMinutes, minutesToTime };



