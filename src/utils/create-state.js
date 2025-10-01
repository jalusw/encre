export default function createState(initialState, onChange) {
  return new Proxy({
    listeners: [],
    ...initialState,
    },{
    set(target, key, value) {
      target[key] = value;
      onChange(target);
      return true;
    },
  });
}
