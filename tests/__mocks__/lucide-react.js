const React = require('react');

const createIcon = (name) => React.forwardRef(({ children, ...props }, ref) => 
  React.createElement('svg', { ...props, ref, 'data-testid': name }, children)
);

module.exports = {
  Check: createIcon('check-icon'),
  ChevronRight: createIcon('chevron-right-icon'),
  X: createIcon('x-icon'),
};