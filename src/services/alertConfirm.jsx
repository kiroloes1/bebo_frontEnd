import Swal from 'sweetalert2'

export function showAlertConfirm({
  title,
  text,
  icon,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel"
}) {
  return Swal.fire({
    icon: icon,
    title: title,
    text: text,
    showConfirmButton: true,
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  })
}