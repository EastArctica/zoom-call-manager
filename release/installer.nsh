!macro customInstall
  ${ifNot} ${isUpdated}
    WriteRegStr HKCU "Software\Zoom Call Manager\Capabilities" "ApplicationName" "Zoom Call Manager"
    WriteRegStr HKCU "Software\Zoom Call Manager\Capabilities" "ApplicationDescription" "Zoom Call Manager"

    WriteRegStr HKCU "Software\Zoom Call Manager\Capabilities\URLAssociations" "tel" "Zoom Call Manager.tel"

    WriteRegStr HKCU "Software\Classes\Zoom Call Manager.tel\DefaultIcon" "" "$INSTDIR\Zoom Call Manager.exe"
    WriteRegStr HKCU "Software\Classes\Zoom Call Manager.tel\shell\open\command" "" '"$INSTDIR\Zoom Call Manager.exe" "%1"'

    WriteRegStr HKCU "Software\RegisteredApplications" "Zoom Call Manager" "Software\Zoom Call Manager\Capabilities"
  ${endIf}
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "Software\RegisteredApplications" "Zoom Call Manager"

  DeleteRegValue HKCU "Software\Zoom Call Manager\Capabilities" "ApplicationName"
  DeleteRegValue HKCU "Software\Zoom Call Manager\Capabilities" "ApplicationDescription"

  DeleteRegValue HKCU "Software\Zoom Call Manager\Capabilities\URLAssociations" "tel"

  DeleteRegValue HKCU "Software\Classes\Zoom Call Manager.tel\DefaultIcon" ""
  DeleteRegValue HKCU "Software\Classes\Zoom Call Manager.tel\shell\open\command" ""

  ; If the ProgId in UserChoice is "Zoom Call Manager.tel", remove the entire UserChoice key
  ClearErrors
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\tel\UserChoice" "ProgId"
  IfErrors 0 +3
    Goto skipUserChoice
  StrCmp $0 "Zoom Call Manager.tel" 0 skipUserChoice
    DeleteRegKey HKCU "SOFTWARE\Microsoft\Windows\Shell\Associations\UrlAssociations\tel\UserChoice"
skipUserChoice:

  DeleteRegKey HKCU "Software\Zoom Call Manager\Capabilities\URLAssociations"
  DeleteRegKey HKCU "Software\Zoom Call Manager\Capabilities"
  DeleteRegKey HKCU "Software\Classes\Zoom Call Manager.tel\shell\open"
  DeleteRegKey HKCU "Software\Classes\Zoom Call Manager.tel\shell"
  DeleteRegKey HKCU "Software\Classes\Zoom Call Manager.tel"
!macroend
