declare module 'jspdf' {
  export default class jsPDF {
    constructor(orientation?: string, unit?: string, format?: string | number[])
    
    setFontSize(size: number): void
    setTextColor(r: number, g: number, b: number): void
    text(text: string, x: number, y: number): void
    save(filename: string): void
    output(type: 'blob'): Blob
    output(type: string): any
    
    internal: {
      pageSize: {
        height: number
        width: number
      }
    }
    
    lastAutoTable?: {
      finalY: number
    }
  }
}

declare module 'jspdf-autotable' {
  interface AutoTableOptions {
    startY?: number
    head?: any[][]
    body?: any[][]
    theme?: string
    headStyles?: any
    margin?: any
    styles?: any
    columnStyles?: any
  }
  
  export default function autoTable(doc: any, options: AutoTableOptions): void
}
