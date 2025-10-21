import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from "./shared/components/sidebar/sidebar";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, Sidebar],
  template: `
    <app-sidebar></app-sidebar>
  `
})
export class AppComponent {
  title = 'hotel-pms';
}
