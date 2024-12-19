export default function Camera() {
  const streamId = 1;
  let url = new URL(window.location.href);

  try {
    url = new URL(process.env.MAIN_API_URL || '');
  } catch {
    url = new URL(window.location.href);
  }

  const serverUrl = url.origin;

  return (
    <div className="flex justify-center">
      <table className="w-[900px]">
        <tbody>
          <tr>
            <td className="w-1/2 align-top text-center">
              <iframe
                title="results"
                className="w-full h-[425px]"
                src={`${serverUrl}/cgi-bin/CameraView.cgi?stream=${streamId}`}
                aria-label="Camera results view"
              />
            </td>
            <td>
              <iframe
                title="cameraForm"
                className="w-full h-[610px]"
                src={`${serverUrl}/cgi-bin/CameraForm.cgi?stream=${streamId}`}
                aria-label="Camera form view"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
