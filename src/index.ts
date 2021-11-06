/* eslint-disable max-len */
// Modified from
// https://github.com/shikijs/shiki/blob/main/packages/shiki/src/renderer.ts

import { FontStyle } from 'shiki'
import type { IThemedToken } from 'shiki'

export type ElementType = 'pre' | 'code' | 'line' | 'token'
export interface PreElementProps {
  className: string,
  style: string,
  children: string,
}

export interface CodeElementProps {
  children: string
}

export interface LineElementProps {
  className: string,
  lines: IThemedToken[][],
  line: IThemedToken[],
  index: number,
  children: string,
}

export interface TokenElementProps {
  style: string
  tokens: IThemedToken[]
  token: IThemedToken
  index: number,
  children: string,
}

export type PreElementFunction = ( props: PreElementProps ) => string
export type CodeElementFunction = ( props: CodeElementProps ) => string
export type LineElementFunction = ( props: LineElementProps ) => string
export type TokenElementFunction = ( props: TokenElementProps ) => string

export type ElementsOptions = {
  pre?: PreElementFunction,
  code?: CodeElementFunction,
  line?: LineElementFunction,
  token?: TokenElementFunction,
}

export interface HtmlRendererOptions {
  langId?: string
  fg?: string
  bg?: string
  elements?: ElementsOptions
}

interface IHTMLEscapes {
  [key: string]: string
}

const defaultElements: ElementsOptions = {
  pre( { className, style, children } ) {
    return `<pre class="${ className }" style="${ style }">${ children }</pre>`
  },

  code( { children } ) {
    return `<code>${ children }</code>`
  },

  line( { children } ) {
    return `<span class="line">${ children }</span>`
  },

  token( { style, children } ) {
    return `<span style="${ style }">${ children }</span>`
  }
}

export function render(
  lines: IThemedToken[][],
  options: HtmlRendererOptions = {}
): string {
  const bg = options.bg || '#fff'
  const userElements: ElementsOptions | undefined = options.elements

  function h(
    type: ElementType,
    props: { className?: string; style?: string; lines?: IThemedToken[][]; line?: IThemedToken[]; index?: number; tokens?: IThemedToken[]; token?: IThemedToken },
    children: string[]
  ): string {
    const element = ( userElements && userElements[ type ] ) ||
      defaultElements[ type ]
    children = children.filter( Boolean )

    if ( type === 'pre' ) {
      return ( element as PreElementFunction )( {
        className: props.className || '',
        style: props.style || '',
        children: children.join( '' )
      } )
    }

    if ( type === 'code' ) {
      return ( element as CodeElementFunction )( {
        children: children.join( '\n' )
      } )
    }

    if ( type === 'line' ) {
      return ( element as LineElementFunction )( {
        className: props.className || '',
        lines: props.lines || [],
        line: props.line as IThemedToken[],
        index: props.index as number,
        children: children.join( '' )
      } )
    }

    if ( type === 'token' ) {
      return ( element as TokenElementFunction )( {
        style: props.style || '',
        tokens: props.tokens || [],
        token: props.token as IThemedToken,
        index: props.index as number,
        children: children.join( '' )
      } )
    }

    return ''
  }

  // eslint-disable-next-line max-len
  return h( 'pre', { className: 'shiki', style: `background-color: ${ bg };` }, [
    options.langId ? `<div class="language-id">${ options.langId }</div>` : '',
    h(
      'code',
      {},
      lines.map( ( line, index ) => {
        return h(
          'line',
          {
            className: 'line',
            lines,
            line,
            index
          },
          line.map( ( token: IThemedToken, index ) => {
            const cssDeclarations = [ `color: ${ token.color || options.fg }` ]
            const fontStyle = token.fontStyle || FontStyle.None

            if ( fontStyle & FontStyle.Italic ) {
              cssDeclarations.push( 'font-style: italic' )
            }
            if ( fontStyle & FontStyle.Bold ) {
              cssDeclarations.push( 'font-weight: bold' )
            }
            if ( fontStyle & FontStyle.Underline ) {
              cssDeclarations.push( 'text-decoration: underline' )
            }

            return h(
              'token',
              {
                style: cssDeclarations.join( ';' ) + ';',
                tokens: line,
                token,
                index
              },
              [ escapeHtml( token.content ) ]
            )
          } )
        )
      } )
    )
  ] )
}

const htmlEscapes: IHTMLEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;'
}

function escapeHtml( html: string ) {
  return html.replace( /[&<>"']/g, chr => htmlEscapes[ chr ] )
}
