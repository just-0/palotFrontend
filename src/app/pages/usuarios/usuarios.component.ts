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
      password: [''],
      tipo: ['', Validators.required],
      numDias: [0],
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
    this.http.get<Playa[]>(`${environment.apiBaseUrl}/showPlayas`)
      .subscribe({
        next: (playas) => {
          this.availablePlayas = playas;
        },
        error: (error) => {
          console.error('Error loading playas:', error);
        }
      });
  }

  openCreateUserModal() {
    this.editingUser = null;
    this.selectedPlayas = [];
    this.userForm.reset();
    this.userForm.patchValue({
      numDias: 0,
      playasAsignadas: []
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
      numDias: user.numDias || 0,
      playasAsignadas: this.selectedPlayas
    });
    
    this.showUserModal = true;
  }

  closeUserModal() {
    this.showUserModal = false;
    this.editingUser = null;
    this.selectedPlayas = [];
    this.userForm.reset();
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

  deleteUser(user: User) {
    if (confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.nombre}?`)) {
      this.userService.deleteUser(user.id, user.tipo)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadUsers();
            }
          },
          error: (error) => {
            console.error('Error deleting user:', error);
          }
        });
    }
  }
}
