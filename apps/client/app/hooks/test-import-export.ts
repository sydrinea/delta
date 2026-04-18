import type { TestCase } from '@delta/examples'
import { TestCaseArraySchema } from '@delta/examples'

interface UseTestImportExportOptions {
  tests: TestCase[]
  setTests: (tests: TestCase[]) => void
  machineName: string
  showAlert: (payload: { title: string, message: string }) => void
}

export function testImportExport({ tests, setTests, machineName, showAlert }: UseTestImportExportOptions) {
  const handleTestImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const result = TestCaseArraySchema.safeParse(parsed)
        if (!result.success) {
          showAlert({
            title: 'Invalid Test Format',
            message: `Expected an array of { input: string, expected: boolean }.\n\n${result.error.issues.map(i => i.message).join('\n')}`,
          })
          return
        }
        setTests(result.data.map(t => ({ ...t, id: crypto.randomUUID() })))
      }
      catch {
        showAlert({
          title: 'Invalid JSON',
          message: 'The selected file is not valid JSON.',
        })
      }
    }

    reader.readAsText(file)
    e.target.value = ''
  }

  const handleTestExport = () => {
    if (tests.length === 0)
      return

    const exportData = tests.map(({ input, expected }) => ({ input, expected }))
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${machineName || 'delta'}_tests.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return { handleTestImport, handleTestExport }
}
