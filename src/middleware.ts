import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/graphql')) {
    return NextResponse.rewrite(
      new URL(
        `${process.env.SERVER_URL}${request.nextUrl.pathname}` ||
          'http://localhost:5000/api/graphql'
      )
    );
  }
  if (request.nextUrl.pathname.startsWith('/.well-known')) {
    return NextResponse.rewrite(
      new URL(
        `${process.env.SERVER_URL}${request.nextUrl.pathname}${request.nextUrl.search}` ||
          'http://localhost:5000/.well-known'
      )
    );
  }
  if (request.nextUrl.pathname.startsWith('/lnurlp')) {
    return NextResponse.rewrite(
      new URL(
        `${process.env.SERVER_URL}${request.nextUrl.pathname}${request.nextUrl.search}` ||
          'http://localhost:5000/lnurlp'
      )
    );
  }
  if (request.nextUrl.pathname.startsWith('/proxy/api/event')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('cookie', '');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
}
