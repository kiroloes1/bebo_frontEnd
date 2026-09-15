import Swal from 'sweetalert2'

export function showAlert({ title, icon }) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: icon,
    title: title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true
  })
}