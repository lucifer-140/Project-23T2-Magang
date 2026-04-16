import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const roleCookie = request.cookies.get('userRole')?.value;
    
    // Not logged in -> redirect to login
    if (!roleCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Safely decode cookie value
    let decodedRoleStr = roleCookie || '';
    try { decodedRoleStr = decodeURIComponent(decodedRoleStr); } catch(e) {}
    
    // Parse roles array
    let roles: string[] = [];
    try {
      const parsed = JSON.parse(decodedRoleStr);
      if (Array.isArray(parsed)) roles = parsed;
      else roles = [parsed];
    } catch (e) {
      roles = [decodedRoleStr];
    }

    // Determine fallback dashboard based on highest privilege
    const getDefaultDashboard = (userRoles: string[]) => {
      if (userRoles.includes('MASTER')) return '/dashboard/master';
      if (userRoles.includes('ADMIN')) return '/dashboard/admin';
      return '/dashboard/dosen'; // Default for combinable roles
    };
    
    // 1. MASTER Route Protection
    if (pathname.startsWith('/dashboard/master') && !roles.includes('MASTER')) {
      return NextResponse.redirect(new URL(getDefaultDashboard(roles), request.url));
    }
    
    // 2. ADMIN Route Protection
    if (pathname.startsWith('/dashboard/admin') && !roles.includes('ADMIN')) {
      return NextResponse.redirect(new URL(getDefaultDashboard(roles), request.url));
    }

    // 3. KAPRODI Route Protection
    if (pathname.startsWith('/dashboard/kaprodi') && !roles.includes('KAPRODI')) {
      return NextResponse.redirect(new URL(getDefaultDashboard(roles), request.url));
    }

    // 4. KOORDINATOR Route Protection
    if (pathname.startsWith('/dashboard/koordinator') && !roles.includes('KOORDINATOR')) {
      return NextResponse.redirect(new URL(getDefaultDashboard(roles), request.url));
    }

    // 5. DOSEN Route Protection
    // Dosen dashboard is shared by Dosen, Kaprodi, and Koordinator as their base workspace
    const hasAcademicRole = roles.some(r => ['DOSEN', 'KAPRODI', 'KOORDINATOR'].includes(r));
    if (pathname.startsWith('/dashboard/dosen') && !hasAcademicRole) {
      return NextResponse.redirect(new URL(getDefaultDashboard(roles), request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
