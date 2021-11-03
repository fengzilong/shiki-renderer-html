// Modified from
// https://github.com/shikijs/shiki/blob/main/packages/shiki/src/renderer.ts

import { FontStyle } from 'shiki'
import type { IThemedToken } from 'shiki'

export interface ElementProps {
  children: string
  [key: string]: unknown
}

export interface TokenElementProps extends ElementProps {
  style: string
  tokens: IThemedToken[]
  token: IThemedToken
  index: number
}

export interface ElementsOptions {
  [key: string]: ( props: ElementProps ) => string
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
) {
  const bg = options.bg || '#fff'
  const userElements = options.elements || {}

  function h(
    type: string,
    props: object,
    children: string[]
  ): string {
    const element = userElements[ type ] || defaultElements[ type ]
    if ( element ) {
      children = children.filter( Boolean )

      return element( {
        ...props,
        children: type === 'code' ? children.join( '\n' ) : children.join( '' )
      } )
    }

    return ''
  }

  return h( 'pre', { className: 'shiki', style: `background-color: ${ bg }` }, [
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
                style: cssDeclarations.join( '; ' ),
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
