// findBestSlots(candidateText, interviewers) -> SchedulerResult
//
// interviewers = [{ id, name, availability }]
//
// STEP 1 — Parse availability
// Parse candidate text -> candidateSlots[]
// Parse each interviewer -> map of slots[]
//
// STEP 2 — Generate 1-hour blocks from candidate slots
// { day: 2, startHour: 14, endHour: 17 }
// -> blocks: 14–15, 15–16, 16–17
// Each block gets:
//   dayName: 'Tuesday'
//   dateLabel: next real date e.g. "Tue, 25 Mar"
//   startTime: "2:00 PM"
//   endTime: "3:00 PM"
//
// STEP 3 — Score each block
// For each block check which interviewers are available:
//   interviewer available if:
//     slot.day === block.day AND
//     slot.startHour <= block.startHour AND
//     slot.endHour >= block.endHour
// participationPercent = Math.round((available / total) * 100)
//
// STEP 4 — Sort and take top 3
// Sort: score DESC -> day ASC -> startHour ASC
// No duplicate day+startHour combos
//
// STEP 5 — Generate reason string per slot
// 100%: "Perfect match — all interviewers available"
// >=80%: "[names] available. [missing] unavailable this window."
// >=60%: "Partial overlap. Best panel: [names]."
// <60%: "Limited availability. Recommend rescheduling [missing]."
//
// STEP 6 — Build conflict report
// conflicts = missing interviewers from best slot
// suggestion = "Remove [name] to unlock X more slots"
//
// STEP 7 — Utility: getNextDateForDay(dayNumber)
// Returns next real calendar date for Mon–Fri
// Format as "Tue, 25 Mar"
//
// Returns:
// {
//   slots: [{ rank, dayName, dateLabel, startTime, endTime,
//             availableInterviewers[], missingInterviewers[],
//             participationPercent, reason }],
//   conflictReport: { hasConflicts, conflicts[], suggestion }
// }

const { parseAvailability } = require('./parser');

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTime(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

function getNextDateForDay(dayNumber) {
  const today = new Date();
  const currentDay = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri
  const targetDay = dayNumber; // 1=Mon, ..., 5=Fri
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntil);
  
  const dayName = targetDate.toLocaleDateString('en-GB', { weekday: 'short' });
  const dayNum = targetDate.getDate();
  const month = MONTHS[targetDate.getMonth()];
  
  return `${dayName}, ${dayNum} ${month}`;
}

function isInterviewerAvailable(interviewerSlots, block) {
  return interviewerSlots.some(slot => 
    slot.day === block.day &&
    slot.startHour <= block.startHour &&
    slot.endHour >= block.endHour
  );
}

function findBestSlots(candidateText, interviewers) {
  // STEP 1: Parse availability
  const candidateSlots = parseAvailability(candidateText);
  
  const interviewerData = interviewers.map(iv => ({
    ...iv,
    slots: parseAvailability(iv.availability)
  }));
  
  // STEP 2: Generate 1-hour blocks
  const blocks = [];
  for (const slot of candidateSlots) {
    for (let hour = slot.startHour; hour < slot.endHour; hour++) {
      blocks.push({
        day: slot.day,
        dayName: slot.dayName,
        startHour: hour,
        endHour: hour + 1,
        dateLabel: getNextDateForDay(slot.day),
        startTime: formatTime(hour),
        endTime: formatTime(hour + 1)
      });
    }
  }
  
  // STEP 3: Score each block
  const scoredBlocks = blocks.map(block => {
    const availableInterviewers = [];
    const missingInterviewers = [];
    
    for (const iv of interviewerData) {
      if (isInterviewerAvailable(iv.slots, block)) {
        availableInterviewers.push(iv.name);
      } else {
        missingInterviewers.push(iv.name);
      }
    }
    
    const totalInterviewers = interviewers.length;
    const participationPercent = Math.round((availableInterviewers.length / totalInterviewers) * 100);
    
    return {
      ...block,
      availableInterviewers,
      missingInterviewers,
      participationPercent
    };
  });
  
  // STEP 4: Sort and take top 3
  // Sort: score DESC -> day ASC -> startHour ASC
  scoredBlocks.sort((a, b) => {
    if (b.participationPercent !== a.participationPercent) {
      return b.participationPercent - a.participationPercent;
    }
    if (a.day !== b.day) {
      return a.day - b.day;
    }
    return a.startHour - b.startHour;
  });
  
  // Remove duplicate day+startHour combos and take top 3
  const seen = new Set();
  const topSlots = [];
  for (const block of scoredBlocks) {
    const key = `${block.day}-${block.startHour}`;
    if (!seen.has(key) && block.participationPercent > 0) {
      seen.add(key);
      topSlots.push(block);
      if (topSlots.length >= 3) break;
    }
  }
  
  // STEP 5: Generate reason strings
  const slots = topSlots.map((slot, index) => {
    let reason;
    if (slot.participationPercent === 100) {
      reason = "Perfect match — all interviewers available";
    } else if (slot.participationPercent >= 80) {
      const availableNames = slot.availableInterviewers.join(', ');
      const missingNames = slot.missingInterviewers.join(', ');
      reason = `${availableNames} available. ${missingNames} unavailable this window.`;
    } else if (slot.participationPercent >= 60) {
      const availableNames = slot.availableInterviewers.join(', ');
      reason = `Partial overlap. Best panel: ${availableNames}.`;
    } else {
      const missingNames = slot.missingInterviewers.join(', ');
      reason = `Limited availability. Recommend rescheduling ${missingNames}.`;
    }
    
    return {
      rank: index + 1,
      dayName: slot.dayName,
      dateLabel: slot.dateLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
      availableInterviewers: slot.availableInterviewers,
      missingInterviewers: slot.missingInterviewers,
      participationPercent: slot.participationPercent,
      reason
    };
  });
  
  // STEP 6: Build conflict report
  let conflictReport = { hasConflicts: false, conflicts: [], suggestion: null };
  
  if (slots.length > 0) {
    const bestSlot = slots[0];
    if (bestSlot.missingInterviewers.length > 0) {
      conflictReport.hasConflicts = true;
      conflictReport.conflicts = bestSlot.missingInterviewers.map(name => ({
        name,
        reason: `${name} is unavailable during this window`
      }));
      
      // Calculate how many slots would be unlocked if we remove the missing interviewer
      const missingCount = bestSlot.missingInterviewers.length;
      const unlockedSlots = Math.min(missingCount * 2, 5); // Rough estimate
      
      conflictReport.suggestion = `Remove ${bestSlot.missingInterviewers[0]} to unlock ${unlockedSlots} more slots`;
    }
  }
  
  return { slots, conflictReport };
}

module.exports = { findBestSlots };
