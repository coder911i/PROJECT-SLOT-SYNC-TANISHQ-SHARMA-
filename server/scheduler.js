function findBestSlots(candidateSlots, interviewerSlots, count = 3) {
  const matches = [];

  for (const cSlot of candidateSlots) {
    for (const iSlot of interviewerSlots) {
      
      // Check same date
      const cDate = cSlot.availableDate || cSlot.availability;
      const iDate = iSlot.availableDate;
      
      if (cDate === iDate) {
        const cStart = timeToMinutes(cSlot.startTime);
        const cEnd = timeToMinutes(cSlot.endTime);
        const iStart = timeToMinutes(iSlot.startTime);
        const iEnd = timeToMinutes(iSlot.endTime);

        const overlapStart = Math.max(cStart, iStart);
        const overlapEnd = Math.min(cEnd, iEnd);
        const overlapMinutes = overlapEnd - overlapStart;

        if (overlapMinutes >= 30) {
          const score = Math.min(
            Math.round((overlapMinutes / 120) * 100), 
            100
          );
          
          matches.push({
            date: cDate,
            startTime: minutesToTime(overlapStart),
            endTime: minutesToTime(
              Math.min(overlapStart + 60, overlapEnd)
            ),
            score: score,
            candidateName: cSlot.personName,
            candidateEmail: cSlot.personEmail,
            candidateId: cSlot.id,
            interviewerName: iSlot.personName,
            interviewerEmail: iSlot.personEmail,
            interviewerId: iSlot.id,
            overlapMinutes: overlapMinutes
          });
        }
      }
    }
  }

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function timeToMinutes(time) {
  if (!time) return 0;
  const parts = time.split(':');
  return parseInt(parts[0]) * 60 + 
         parseInt(parts[1]);
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60)
    .toString().padStart(2, '0');
  const m = (minutes % 60)
    .toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = { findBestSlots };
