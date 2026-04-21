import { type Dispatch, type FormEvent, type SetStateAction, useEffect, useRef } from 'react'
import type { InsertDialogState } from '../types/editor'

type InsertDialogProps = {
  dialogState: NonNullable<InsertDialogState>
  onChange: Dispatch<SetStateAction<InsertDialogState>>
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function InsertDialog({
  dialogState,
  onChange,
  onClose,
  onSubmit,
}: InsertDialogProps) {
  const textInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    textInputRef.current?.focus()
    textInputRef.current?.select()
  }, [])

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insert-dialog-title"
      >
        <div className="dialog-header">
          <div>
            <p className="eyebrow">插入内容</p>
            <h3 id="insert-dialog-title">
              {dialogState.mode === 'link' ? '插入链接' : '插入图片'}
            </h3>
          </div>
          <button type="button" className="close-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <form className="dialog-form" onSubmit={onSubmit}>
          <label>
            {dialogState.mode === 'link' ? '显示文字' : '图片说明'}
            <input
              ref={textInputRef}
              type="text"
              value={dialogState.text}
              onChange={(event) =>
                onChange((current) =>
                  current
                    ? {
                        ...current,
                        text: event.target.value,
                      }
                    : current,
                )
              }
              placeholder={
                dialogState.mode === 'link' ? '请输入链接文字' : '请输入 alt 文本'
              }
            />
          </label>

          <label>
            URL
            <input
              type="url"
              required
              value={dialogState.url}
              onChange={(event) =>
                onChange((current) =>
                  current
                    ? {
                        ...current,
                        url: event.target.value,
                      }
                    : current,
                )
              }
              placeholder="https://example.com"
            />
          </label>

          <div className="dialog-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="primary-button">
              插入
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
