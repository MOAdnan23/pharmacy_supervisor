/**
 * تبويب الصلاحيات — UC-15
 * Matrix أدوار × صلاحيات عامة (قراءة فقط)
 */
import { useEffect, useMemo, useState } from 'react'
import { getPermissionsDatasource } from '../data'
import type {
  PermissionAccess,
  PermissionsMatrix,
  SystemRole,
} from '../domain/permissionEntities'
import './permissions.css'

function accessLabel(access: PermissionAccess): string {
  if (access === 'yes') return 'نعم'
  if (access === 'read') return 'عرض'
  return 'لا'
}

function accessClass(access: PermissionAccess): string {
  if (access === 'yes') return 'yes'
  if (access === 'read') return 'read'
  return 'no'
}

export function PermissionsPanel() {
  const datasource = useMemo(() => getPermissionsDatasource(), [])
  const [matrix, setMatrix] = useState<PermissionsMatrix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    datasource
      .getMatrix()
      .then((data) => {
        if (alive) setMatrix(data)
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : 'تعذّر تحميل الصلاحيات')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [datasource])

  if (loading) {
    return <p className="users-note">جاري تحميل الصلاحيات...</p>
  }

  if (!matrix) {
    return <p className="users-note">{error ?? 'لا توجد بيانات صلاحيات'}</p>
  }

  const roleIds = matrix.roles.map((r) => r.id)

  return (
    <div className="permissions">
      <header className="permissions-head">
        <div>
          <h2>صلاحيات الأدوار</h2>
          <p>عرض فقط · الصلاحيات مرتبطة بالدور ولا تُعدَّل من هنا</p>
        </div>
        <span className="permissions-badge">قراءة فقط</span>
      </header>

      <section className="permissions-platforms">
        {matrix.roles.map((role) => (
          <article key={role.id}>
            <strong>{role.label}</strong>
            <span>{role.platform}</span>
          </article>
        ))}
      </section>

      <div className="users-table-wrap">
        <table className="permissions-table">
          <thead>
            <tr>
              <th>الصلاحية</th>
              {matrix.roles.map((role) => (
                <th key={role.id}>{role.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.permissions.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="perm-label">{row.label}</div>
                  {row.hint && <div className="perm-hint">{row.hint}</div>}
                </td>
                {roleIds.map((roleId: SystemRole) => {
                  const access = row.access[roleId]
                  return (
                    <td key={roleId}>
                      <span className={`perm-cell ${accessClass(access)}`}>
                        {accessLabel(access)}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="permissions-notes">
        {matrix.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </div>
  )
}
