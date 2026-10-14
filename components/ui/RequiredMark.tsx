/** Red asterisk after a required field's label. Screen readers rely on the input's `required` instead. */
export default function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-600">
      *
    </span>
  );
}
