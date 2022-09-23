module.exports = {
  dateFormatter: function(rawDate) {
    // ✅ Reset a Date's time to midnight
    rawDate.setHours(0, 0, 0, 0);
  
    // ✅ Format a date to YYYY-MM-DD (or any other format)
    function padTo2Digits(num) {
      return num.toString().padStart(2, '0');
    }
  
    function formatDate(date) {
      return [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate()),
      ].join('-')
    }
  
    return formatDate(rawDate)
  },

  returnDateInOneYear: function() {
    const date = new Date()
    const dateInAYear = date.setFullYear(date.getFullYear() + 1)
    return dateInAYear
  }

}
