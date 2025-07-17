import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserService, User } from '../../services/user.service';

interface Playa {
  id_playa: number;
  nombre: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: false,
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  users: User[] = [];
  availablePlayas: Playa[] = [];
  showUserModal = false;
  editingUser: User | null = null;
  userForm: FormGroup;
  isLoading = false;
  selectedPlayas: number[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private userService: UserService
  ) {
    this.userForm = this.fb.group({
      nombre: ['', Validators.required],
      password: ['', Validators.required],
      tipo: ['empleado', Validators.required], // Por defecto empleado
      playasAsignadas: [[]]
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadPlayas();
  }

  loadUsers() {
    this.userService.getAllUsers()
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.users = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading users:', error);
        }
      });
  }

  loadPlayas() {
    this.http.get<Playa[]>(`${environment.apiBaseUrl}/allPlayas`)
      .subscribe({
        next: (playas) => {
          this.availablePlayas = playas;
        },
        error: (error) => {
          console.error('Error loading playas:', error);
          this.availablePlayas = []; // Asegurar que esté vacío en caso de error
        }
      });
  }

  openCreateUserModal() {
    this.editingUser = null;
    // Por defecto, marcar todas las playas para empleados
    this.selectedPlayas = this.availablePlayas.map(p => p.id_playa);
    this.userForm.reset();
    this.userForm.patchValue({
      tipo: 'empleado', // Por defecto empleado
      password: '', // Requerida para nuevos usuarios
      playasAsignadas: this.selectedPlayas
    });
    this.showUserModal = true;
  }

  editUser(user: User) {
    this.editingUser = user;
    this.selectedPlayas = user.playas.map(p => p.id_playa);
    
    this.userForm.patchValue({
      nombre: user.nombre,
      password: '', // No mostrar contraseña actual
      tipo: user.tipo,
      playasAsignadas: this.selectedPlayas
    });
    
    // Para edición, la contraseña no es requerida
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.editingUser = null;
    this.selectedPlayas = [];
    this.userForm.reset();
    // Restablecer validadores para nuevos usuarios
    this.userForm.get('password')?.setValidators([Validators.required]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.patchValue({
      tipo: 'empleado' // Por defecto empleado
    });
  }

  onPlayaSelectionChange(event: any) {
    const playaId = parseInt(event.target.value);
    if (event.target.checked) {
      this.selectedPlayas.push(playaId);
    } else {
      this.selectedPlayas = this.selectedPlayas.filter(id => id !== playaId);
    }
    this.userForm.patchValue({ playasAsignadas: this.selectedPlayas });
  }

  saveUser() {
    if (!this.userForm.valid) return;

    this.isLoading = true;
    const formData = { ...this.userForm.value };
    formData.playasAsignadas = this.selectedPlayas;

    // Si estamos editando y no hay contraseña nueva, no enviarla
    if (this.editingUser && !formData.password) {
      delete formData.password;
    }

    const request = this.editingUser 
      ? this.userService.updateUser(this.editingUser.id, formData)
      : this.userService.createUser(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
          this.closeUserModal();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving user:', error);
        this.isLoading = false;
      }
    });
  }

  // Verificar si un campo es inválido y ha sido tocado
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Modal para eliminar usuario
  showDeleteUserModal = false;
  userToDelete: User | null = null;
  deleteUserConfirmationText = '';
  isDeletingUser = false;

  deleteUser(user: User) {
    this.userToDelete = user;
    this.deleteUserConfirmationText = '';
    this.showDeleteUserModal = true;
  }

  closeDeleteUserModal() {
    this.showDeleteUserModal = false;
    this.userToDelete = null;
    this.deleteUserConfirmationText = '';
  }

  confirmDeleteUser() {
    if (!this.userToDelete || this.deleteUserConfirmationText !== this.userToDelete.nombre) {
      return;
    }

    this.isDeletingUser = true;
    
    this.userService.deleteUser(this.userToDelete.id, this.userToDelete.tipo)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers();
            this.closeDeleteUserModal();
          } else {
            alert(response.message || 'Error al eliminar usuario');
          }
          this.isDeletingUser = false;
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Error al eliminar usuario');
          this.isDeletingUser = false;
        }
      });
  }
}
