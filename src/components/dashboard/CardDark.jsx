import PropTypes from "prop-types";

export default function CardDark({ children, className = "" }) {
  return (
    <div className={`rounded-xl2 shadow-soft border border-white/10 bg-[#121212] text-white ${className}`}>
      {children}
    </div>
  );
}

CardDark.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
