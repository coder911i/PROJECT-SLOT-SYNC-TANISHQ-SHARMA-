// parseAvailability(text) -> [{ day, dayName, startHour, endHour }]
//
// Handles ALL these formats:
// "Tue–Thu 2–5 PM"          -> Tue,Wed,Thu 14–17
// "Tue-Thu 2-5 PM"          -> same (both dash types)
// "Mon, Wed 9 AM–12 PM"     -> Mon,Wed 09–12
// "Fri 9 AM–12 PM, 3–6 PM"  -> Fri 09–12 AND 15–18
// "Monday 14:00–17:00"      -> Mon 14–17
// "Tue 3–6 PM"              -> Tue 15–18
// "Wed 10 AM–1 PM"          -> Wed 10–13
//
// Day map: Mon=1,Tue=2,Wed=3,Thu=4,Fri=5
//
// Time rules:
// "9 AM"->9, "12 PM"->12, "1 PM"->13, "6 PM"->18, "12 AM"->0
// "2–5 PM" -> start=14, end=17
// "9 AM–12 PM" -> start=9, end=12
// If end < start and no AM/PM on end -> assume same period
//
// Returns array of:
// { day: 2, dayName: 'Tuesday', startHour: 14, endHour: 17 }

const DAY_MAP = {
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5
};

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function parseTime(timeStr, period) {
  timeStr = timeStr.trim().toLowerCase();
  let hour = parseInt(timeStr);
  
  // Handle 24-hour format
  if (timeStr.includes(':')) {
    hour = parseInt(timeStr.split(':')[0]);
    return hour;
  }
  
  // Handle AM/PM
  if (period) {
    period = period.toLowerCase();
    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }
  }
  
  return hour;
}

function parseTimeRange(rangeStr) {
  // Normalize dashes
  rangeStr = rangeStr.replace(/–/g, '-');
  
  // Handle formats like "2-5 PM", "9 AM-12 PM", "14:00-17:00"
  const match = rangeStr.match(/(\d+(?::\d+)?)\s*(am|pm)?\s*-\s*(\d+(?::\d+)?)\s*(am|pm)?/i);
  
  if (!match) return null;
  
  let [, start, startPeriod, end, endPeriod] = match;
  
  // If no period specified for end, use start's period
  if (!endPeriod && startPeriod) {
    endPeriod = startPeriod;
  }
  
  const startHour = parseTime(start, startPeriod);
  const endHour = parseTime(end, endPeriod);
  
  return { startHour, endHour };
}

function getDayNumber(dayStr) {
  dayStr = dayStr.toLowerCase().trim();
  return DAY_MAP[dayStr];
}

function expandDayRange(startDay, endDay) {
  const start = getDayNumber(startDay);
  const end = getDayNumber(endDay);
  
  if (!start || !end) return [];
  
  const days = [];
  let current = start;
  while (true) {
    days.push(current);
    if (current === end) break;
    current++;
    if (current > 5) current = 1;
  }
  return days;
}

function parseAvailability(text) {
  if (!text || typeof text !== 'string') return [];
  
  const results = [];
  const segments = text.split(',').map(s => s.trim()).filter(s => s);
  
  for (const segment of segments) {
    // Check for day range (Mon–Thu or Mon-Thu)
    const dayRangeMatch = segment.match(/^(\w+)[\-–](\w+)\s+(.+)$/i);
    
    if (dayRangeMatch) {
      const [, startDay, endDay, timePart] = dayRangeMatch;
      const days = expandDayRange(startDay, endDay);
      const timeRange = parseTimeRange(timePart);
      
      if (timeRange) {
        for (const day of days) {
          results.push({
            day,
            dayName: DAY_NAMES[day - 1],
            startHour: timeRange.startHour,
            endHour: timeRange.endHour
          });
        }
      }
    } else {
      // Single day or comma-separated days
      const dayMatch = segment.match(/^(\w+)\s+(.+)$/i);
      
      if (dayMatch) {
        const [, dayStr, timePart] = dayMatch;
        const day = getDayNumber(dayStr);
        
        if (day) {
          // Handle multiple time ranges in one day (e.g., "9 AM-12 PM, 3-6 PM")
          const timeRanges = timePart.split(',').map(t => t.trim());
          
          for (const timeRangeStr of timeRanges) {
            const timeRange = parseTimeRange(timeRangeStr);
            if (timeRange) {
              results.push({
                day,
                dayName: DAY_NAMES[day - 1],
                startHour: timeRange.startHour,
                endHour: timeRange.endHour
              });
            }
          }
        }
      }
    }
  }
  
  return results;
}

module.exports = { parseAvailability };
