import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes with parameters - use server-side rendering
  {
    path: 'campsites/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'events/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'marketplace/:id',
    renderMode: RenderMode.Server
  },
  {
    path: 'profile/:id',
    renderMode: RenderMode.Server
  },
  // All other routes - prerender
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
