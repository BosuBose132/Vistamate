import React from 'react';
import { Meteor } from 'meteor/meteor';
import {
  Card,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@mieweb/ui';

export default function ExistingStations({ stations, surveys = [] }) {
  const open = (s) => window.open(`/s/${s.token}`, '_blank');
  const copy = (s) =>
    navigator.clipboard.writeText(`${Meteor.absoluteUrl()}s/${s.token}`);
  const surveyName = (surveyId) =>
    surveys.find((survey) => survey._id === surveyId)?.name || 'Unassigned';

  return (
    <Card className="vm-card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Existing stations
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage kiosk links, availability, and survey assignment.
          </p>
        </div>
        <Badge>{stations.length} total</Badge>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full min-w-[980px] text-left text-sm">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <TableCell className="px-5 py-4">Name</TableCell>
              <TableCell className="px-4 py-4">Location</TableCell>
              <TableCell className="px-4 py-4">Status</TableCell>
              <TableCell className="px-4 py-4">Assigned Survey</TableCell>
              <TableCell className="px-4 py-4">Kiosk URL</TableCell>
              <TableCell className="px-4 py-4">Actions</TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-border">
            {stations.map((s) => (
              <TableRow
                key={s._id}
                className="hover:bg-muted/50 transition-colors"
              >
                <TableCell className="px-5 py-4 font-medium text-foreground">
                  {s.name}
                </TableCell>
                <TableCell className="px-4 py-4 text-muted-foreground">
                  {s.location || '—'}
                </TableCell>
                <TableCell className="px-4 py-4">
                  {s.isActive ? (
                    <Badge variant="success">
                      <span
                        className="me-1 inline-block h-1.5 w-1.5 rounded-full bg-current"
                        aria-hidden="true"
                      />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-4 text-muted-foreground">
                  {surveyName(s.surveyId)}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <code className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    /s/{s.token}
                  </code>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => open(s)}
                    >
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copy(s)}
                    >
                      Copy URL
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        Meteor.call('stations.update', {
                          _id: s._id,
                          updates: { isActive: !s.isActive },
                        })
                      }
                    >
                      {s.isActive ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        Meteor.call('stations.rotate', { _id: s._id })
                      }
                    >
                      Rotate URL
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {stations.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-5 py-12 text-center text-muted-foreground"
                >
                  No stations created yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
