import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/graphql')) {
    return NextResponse.rewrite(
      new URL(
        `${process.env.SERVER_URL}/api/graphql` ||
          'http://localhost:5000/api/graphql'
      )
    );
  }
  if (request.nextUrl.pathname.startsWith('/.well-known')) {
    return NextResponse.rewrite(
      new URL(
        `${process.env.SERVER_URL}/.well-known` ||
          'http://localhost:5000/.well-known'
      )
    );
  }
  if (request.nextUrl.pathname.startsWith('/lnurlp')) {
    return NextResponse.rewrite(
      new URL(
        `${process.env.SERVER_URL}/lnurlp` || 'http://localhost:5000/lnurlp'
      )
    );
  }
}
