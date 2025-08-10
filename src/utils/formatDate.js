export const formatDate = (date, opts = {}) => {
  if (!date) return '';
  const options = {};
  if (opts.date) {
    options.day = '2-digit';
    options.month = '2-digit';
    options.year = 'numeric';
  }
  if (opts.time) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Date(date).toLocaleString('pt-BR', options);
};
